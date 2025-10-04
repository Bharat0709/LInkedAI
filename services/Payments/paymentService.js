const fetch = require('node-fetch');
const AppError = require('../../utils/appError');
const { encryptToken, decryptToken } = require('../../utils/linkedInAuth');
const organizationService = require('../Organization/organizationService');
const paymentRepository = require('../../repositories/paymentRepository');
const orgRepo = require('../../repositories/organizationRepository');
const DODO_API_URL = process.env.DODO_API_URL;
const DODO_PRODUCTS_URL = process.env.DODO_PRODUCTS_URL;
const DODO_API_KEY = process.env.DODO_PAYMENT_TOKEN;

// Create checkout session
const createCheckoutSession = async ({ organizationId, product_id }) => {
  try {
    if (!organizationId || !product_id) {
      throw new AppError('OrganizationId and Product ID are required', 400);
    }

    const organization = await organizationService.getOrganizationById(organizationId);
    if (!organization) throw new AppError('Organization not found', 404);

    // Build request body with customer info
    const requestBody = {
      product_cart: [{ product_id, quantity: 1 }],
      customer: {
        email: organization.email,
        name: organization.name,
        phone_number: null,
      },
      return_url: process.env.DODO_REDIRECT_URL,
      metadata: {
        organizationId: organization._id.toString(),
        product_id,
      },
    };

    // Decrypt and add billing address if available
    if (organization.billingDetails) {
      try {
        const decryptedBilling = getDecryptedBillingDetails(organization);

        if (decryptedBilling) {
          // Only add billing_address if we have at least the country (required field)
          if (decryptedBilling.country) {
            requestBody.confirm = true; // Auto-confirm the payment
            requestBody.billing_address = {
              street: decryptedBilling.addressLine1 || '',
              city: decryptedBilling.city || '',
              state: decryptedBilling.state || '',
              country: decryptedBilling.country,
              zipcode: decryptedBilling.postalCode || '',
            };

            // Add phone number to customer if available
            if (decryptedBilling.phoneNumber) {
              requestBody.customer.phone_number = decryptedBilling.phoneNumber;
            }
          }
        }
      } catch (error) {
        console.error('Error decrypting billing details:', error);
        // Continue without billing info if decryption fails
      }
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
    console.error('Error creating Dodo checkout session:', error);
    throw new AppError(error.message || 'Internal Server Error', 500);
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
    console.error('Error decrypting billing details:', error);
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
    console.log('Product found for ID:', productId, product);

    if (!product) {
      console.warn(`Product not found for ID: ${productId}`);
      return 0;
    }

    // Get credits from metadata
    const credits = product.metadata?.creditsApplicable;
    console.log('Credits found in product metadata:', credits);

    if (!credits) {
      console.warn(`No creditsApplicable found in metadata for product: ${productId}`);
      return 0;
    }

    // Parse credits (it's a string in the metadata)
    const creditsToAdd = parseInt(credits, 10);
    console.log('Parsed credits to add:', creditsToAdd);

    if (isNaN(creditsToAdd)) {
      console.warn(`Invalid credits value in metadata: ${credits}`);
      return 0;
    }

    return creditsToAdd;
  } catch (error) {
    console.error('Error getting credits for product:', error);
    return 0;
  }
};

const handleWebhook = async payload => {
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

    console.log('Webhook payload received:', payload);
    console.log('Processing webhook for session:', payment_id, 'with status:', status);

    // 1. Save/update payment record
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

    // 2. Update organization credits if payment succeeded
    if (status === 'succeeded') {
      const org = await orgRepo.findById(metadata.organizationId);
      if (!org) {
        console.warn(`Organization not found: ${metadata.organizationId}`);
        return;
      }

      // Dynamically fetch credits based on product_id
      const creditsToAdd = await getCreditsForProduct(metadata.product_id);
      console.log(`Credits to add for product ${metadata.product_id}:`, creditsToAdd);

      if (creditsToAdd === 0) {
        console.warn(`No credits to add for product: ${metadata.product_id}`);
        // Still save the payment record but don't add credits
        return;
      }

      // Calculate expiry date (30 days from now)
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      console.log(`Credits will expire at: ${expiresAt}`);

      // Update credit balance and expiry
      org.credits.balance += creditsToAdd;
      org.credits.expiresAt = expiresAt;

      // Add transaction with expiry info
      org.credits.transactions.push({
        type: 'purchase',
        amount: creditsToAdd,
        balance: org.credits.balance,
        expiresAt: expiresAt,
        description: `Purchased ${creditsToAdd} credits via Dodo Payment (expires in 30 days)`,
        metadata: {
          paymentId: payment_id,
          productId: metadata.product_id,
        },
      });

      // Add payment record
      org.payments.push({
        paymentId: payment_id,
        amount: settlement_amount || amount || 0,
        currency: settlement_currency || currency || 'INR',
        creditsAdded: creditsToAdd,
        status,
        processedAt: new Date(),
        paymentMethod: payment_method,
        invoiceId: null,
      });

      // 3. Save or update encrypted billing details
      if (billing) {
        try {
          const encryptedBillingDetails = {
            addressLine1: billing.street ? encryptToken(billing.street) : org.billingDetails?.addressLine1,
            city: billing.city ? encryptToken(billing.city) : org.billingDetails?.city,
            state: billing.state ? encryptToken(billing.state) : org.billingDetails?.state,
            country: billing.country ? encryptToken(billing.country) : org.billingDetails?.country,
            postalCode: billing.zipcode ? encryptToken(billing.zipcode) : org.billingDetails?.postalCode,
          };

          // Add phone number from customer object if available
          if (customer?.phone_number) {
            encryptedBillingDetails.phoneNumber = encryptToken(customer.phone_number);
          } else if (org.billingDetails?.phoneNumber) {
            // Preserve existing phone if no new one provided
            encryptedBillingDetails.phoneNumber = org.billingDetails.phoneNumber;
          }

          // Update organization billing details
          org.billingDetails = encryptedBillingDetails;

          console.log('Billing details encrypted and saved successfully');
        } catch (encryptionError) {
          console.error('Error encrypting billing details:', encryptionError);
          // Continue processing even if billing encryption fails
        }
      }

      await org.save();

      console.log(`Added ${creditsToAdd} credits to org ${metadata.organizationId}, expires at ${expiresAt}`);
    }

    console.log('Webhook processed successfully for session:', payment_id);
  } catch (error) {
    console.error('Error handling webhook:', error);
    throw new Error(error.message || 'Failed to process webhook');
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
    console.error('Error fetching Dodo products:', error);
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
