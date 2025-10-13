const fetch = require('node-fetch');
const AppError = require('../../utils/appError');
const { encryptToken, decryptToken } = require('../../utils/linkedInAuth');
const organizationService = require('../Organization/organizationService');
const paymentRepository = require('../../repositories/paymentRepository');
const orgRepo = require('../../repositories/organizationRepository');
const DODO_API_URL = process.env.DODO_API_URL;
const DODO_PRODUCTS_URL = process.env.DODO_PRODUCTS_URL;
const DODO_API_KEY = process.env.DODO_PAYMENT_TOKEN;
const DODO_REDIRECT_URL = process.env.DODO_REDIRECT_URL ;
// Create checkout session
const createCheckoutSession = async ({ organizationId, product_id }) => {
  try {
    if (!organizationId || !product_id) {
      throw new AppError('OrganizationId and Product ID are required', 400);
    }

    const organization = await organizationService.getOrganizationById(organizationId);
    if (!organization) throw new AppError('Organization not found', 404);

    const requestBody = {
      product_cart: [{ product_id, quantity: 1 }],
      customer: {
        email: organization.email,
        name: organization.name,
        phone_number: null,
      },
      return_url: DODO_REDIRECT_URL,
      metadata: {
        organizationId: organization._id.toString(),
        product_id,
      },
    };

    // Optionally include decrypted billing info
    const decryptedBilling = getDecryptedBillingDetails(organization);
    if (decryptedBilling?.country) {
      requestBody.confirm = true;
      requestBody.billing_address = {
        street: decryptedBilling.addressLine1 || '',
        city: decryptedBilling.city || '',
        state: decryptedBilling.state || '',
        country: decryptedBilling.country,
        zipcode: decryptedBilling.postalCode || '',
      };
      if (decryptedBilling.phoneNumber) requestBody.customer.phone_number = decryptedBilling.phoneNumber;
    }

    const response = await fetch(DODO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DODO_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new AppError(`Failed to create Dodo checkout session: ${text}`, response.status);
    }

    const session = await response.json();
    return session;
  } catch (error) {
    console.error('Error in createCheckoutSession:', error);
    throw new AppError(error.message || 'Failed to create checkout session', 500);
  }
};

// Helper function to decrypt billing details when needed
const getDecryptedBillingDetails = org => {
  if (!org.billingDetails) return null;

  try {
    return {
      addressLine1: org.billingDetails.addressLine1 ? decryptToken(org.billingDetails.addressLine1) : null,
      addressLine2: org.billingDetails.addressLine2 ? decryptToken(org.billingDetails.addressLine2) : null,
      city: org.billingDetails.city ? decryptToken(org.billingDetails.city) : null,
      state: org.billingDetails.state ? decryptToken(org.billingDetails.state) : null,
      country: org.billingDetails.country ? decryptToken(org.billingDetails.country) : null,
      postalCode: org.billingDetails.postalCode ? decryptToken(org.billingDetails.postalCode) : null,
      phoneNumber: org.billingDetails.phoneNumber ? decryptToken(org.billingDetails.phoneNumber) : null,
    };
  } catch (error) {
    return null;
  }
};

// Helper function to get credits from product ID
const getCreditsForProduct = async productId => {
  try {
    const productsData = await fetchAllProducts();
    const products = productsData.items || [];

    if (products.length === 0) {
      console.warn('No products found from Dodo');
      return 0;
    }

    // Find the product by ID
    const product = products.find(p => p.product_id === productId);

    if (!product) {
      console.warn(`Product not found for ID: ${productId}`);
      return 0;
    }

    // Get credits from metadata
    const credits = product.metadata?.creditsApplicable;

    if (!credits) {
      console.warn(`No creditsApplicable found in metadata for product: ${productId}`);
      return 0;
    }

    // Parse credits (it's a string in the metadata)
    const creditsToAdd = parseInt(credits, 10);

    if (isNaN(creditsToAdd)) {
      console.warn(`Invalid credits value in metadata: ${credits}`);
      return 0;
    }

    return creditsToAdd;
  } catch (error) {
    return 0;
  }
};

const handleWebhook = async (payload) => {
  try {
    const { data } = payload;
    const {
      metadata,
      payment_id,
      status,
      amount,
      currency,
      customer,
      billing,
      product_cart,
      settlement_amount,
      settlement_currency,
      settlement_tax,
      payment_link,
      payment_method,
      payment_method_type,
      refunds,
      subscription_id,
      digital_products_delivered,
    } = data;

    // --- Step 1: Validate Org ---
    const org = await orgRepo.findById(metadata.organizationId);
    if (!org) {
      console.warn(`Organization not found: ${metadata.organizationId}`);
      return;
    }

    // --- Step 2: Idempotency Check in DB ---
    const existingPayment = await paymentRepository.findPaymentBySessionId(payment_id);
    if (existingPayment) {
      console.warn(`Duplicate webhook ignored for payment_id: ${payment_id}`);
      return;
    }

    // --- Step 3: Record Payment ---
    const paymentRecord = {
      organizationId: metadata.organizationId,
      sessionId: payment_id,
      productId: metadata.product_id,
      dodoPaymentId: payment_id,
      amount: settlement_amount || amount || 0,
      currency: settlement_currency || currency || 'INR',
      status,
      paymentLink: payment_link,
      paymentMethod: payment_method,
      paymentMethodType: payment_method_type,
      settlementAmount: settlement_amount || 0,
      settlementCurrency: settlement_currency || 'INR',
      settlementTax: settlement_tax || 0,
      metadata,
      customer,
      billing,
      digitalProductsDelivered: digital_products_delivered,
      subscriptionId: subscription_id,
      refunds,
      type: payload.type,
      rawPayload: payload,
    };

    await paymentRepository.createPayment(paymentRecord);

    // --- Step 4: Handle Successful Payments ---
    if (status === 'succeeded') {
      const creditsToAdd = await getCreditsForProduct(metadata.product_id);
      if (creditsToAdd > 0) {
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        org.credits.balance += creditsToAdd;
        org.credits.expiresAt = expiresAt;

        org.credits.transactions.push({
          type: 'purchase',
          amount: creditsToAdd,
          balance: org.credits.balance,
          expiresAt,
          description: `Purchased ${creditsToAdd} credits via Dodo Payment`,
          metadata: { paymentId: payment_id, productId: metadata.product_id },
        });
      }

      org.payments.push({
        paymentId: payment_id,
        amount: settlement_amount || amount || 0,
        currency: settlement_currency || currency || 'INR',
        creditsAdded: creditsToAdd || 0,
        status,
        processedAt: new Date(),
        paymentMethod: payment_method,
      });

      // --- Step 5: Secure Billing Update ---
      if (billing) {
        const encryptedBilling = {};
        try {
          if (billing.street) encryptedBilling.addressLine1 = encryptToken(billing.street);
          if (billing.city) encryptedBilling.city = encryptToken(billing.city);
          if (billing.state) encryptedBilling.state = encryptToken(billing.state);
          if (billing.country) encryptedBilling.country = encryptToken(billing.country);
          if (billing.zipcode) encryptedBilling.postalCode = encryptToken(billing.zipcode);

          if (customer?.phone_number)
            encryptedBilling.phoneNumber = encryptToken(customer.phone_number);

          org.billingDetails = { ...org.billingDetails, ...encryptedBilling };
        } catch (err) {
          console.error('Error encrypting billing details:', err);
        }
      }

      await org.save();
      console.log(`✅ Payment processed successfully: ${payment_id}`);
    }
  } catch (error) {
    console.error('Webhook Processing Error:', error);
    throw new AppError(error.message || 'Failed to process webhook', 500);
  }
};

// Fetch all payments for an organization
const getOrganizationPayments = async organizationId => {
  return await paymentRepository.findPaymentsByOrganization(organizationId);
};

// Fetch single payment by session
const getPaymentBySession = async sessionId => {
  return await paymentRepository.findPaymentBySessionId(sessionId);
};

const fetchAllProducts = async () => {
  try {
    const res = await fetch(DODO_PRODUCTS_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DODO_API_KEY}`,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new AppError(`Failed to fetch products: ${text}`, res.status);
    }
    const data = await res.json();
    return data || [];
  } catch (error) {
    throw new AppError(error.message || 'Failed to fetch products', 500);
  }
};

module.exports = {
  createCheckoutSession,
  getOrganizationPayments,
  handleWebhook,
  fetchAllProducts,
  getPaymentBySession,
};
