const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');
const paymentService = require('../../services/Payments/paymentService');
const { Webhook } = require('standardwebhooks');

const webhook = new Webhook(process.env.DODO_PAYMENTS_WEBHOOK_KEY);

exports.getDodoProducts = catchAsync(async (req, res, next) => {
  const products = await paymentService.fetchAllProducts();

  res.status(200).json({
    status: 'success',
    results: products.length,
    data: {
      products,
    },
  });
});

// Create checkout session
exports.createPayment = catchAsync(async (req, res, next) => {
  const { product_id } = req.body;
  const organizationId = req.organization.id;
  if (!organizationId) {
    return next(new AppError('Organization not found', 404));
  }
  const session = await paymentService.createCheckoutSession({ organizationId, product_id });

  res.status(200).json({
    status: 'success',
    session,
  });
});

// Webhook endpoint
exports.paymentWebhook = catchAsync(async (req, res, next) => {
  try {
    const headers = {
      'webhook-id': req.headers['webhook-id'] || '',
      'webhook-signature': req.headers['webhook-signature'] || '',
      'webhook-timestamp': req.headers['webhook-timestamp'] || '',
    };

    const isValid = await webhook.verify(JSON.stringify(req.body), headers);
    if (!isValid) return res.status(400).json({ status: 'fail', message: 'Invalid webhook' });
    await paymentService.handleWebhook(req.body);
    res.status(200).json({ status: 'success', received: true });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Webhook handler failed' });
  }
});

// Get payments for organization
exports.getOrganizationPayments = catchAsync(async (req, res, next) => {
  const organizationId = req.params.organizationId;
  const payments = await paymentService.getOrganizationPayments(organizationId);

  res.status(200).json({
    status: 'success',
    data: payments,
  });
});
