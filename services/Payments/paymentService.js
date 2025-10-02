const fetch = require('node-fetch');
const AppError = require('../../utils/appError');
const organizationService = require('../Organization/organizationService');
const paymentRepository = require('../../repositories/paymentRepository');
const orgRepo = require('../../repositories/organizationRepository');
const DODO_API_URL = process.env.DODO_API_UPL;
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

    const response = await fetch(DODO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DODO_API_KEY}`,
      },
      body: JSON.stringify({
        product_cart: [{ product_id, quantity: 1 }],
        customer: { email: organization.email, name: organization.name, phone_number: null },
        return_url: process.env.DODO_REDIRECT_URL,
        metadata: { organizationId: organization._id.toString(), product_id },
      }),
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
      if (!org) return;

      // Map product_id to credits
      let creditsToAdd = 0;
      switch (metadata.product_id) {
        case 'pdt_2TptGkLO4V3SmnTp98SKZ':
          creditsToAdd = 100;
          break;
        case 'pdt_hTKuR1xt7W1rTFtRqFN02':
          creditsToAdd = 200;
          break;
        case 'pdt_BhMQNUSPXTMejoQtY6tpS':
          creditsToAdd = 500;
          break;
        case 'prod_800':
          creditsToAdd = 800;
          break;
        case 'prod_1000':
          creditsToAdd = 1000;
          break;
        default:
          creditsToAdd = 0;
      }

      // Calculate expiry date (30 days from now)
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

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
