const express = require('express');
const paymentsController = require('../controllers/Payments/paymentsController');
const router = express.Router();
const { verifyToken } = require('../middlewares/verifytoken');

// Create checkout session
router.post('/webhook', express.json(), paymentsController.paymentWebhook);

router.use(verifyToken);
router.post('/create', paymentsController.createPayment);

// Dodo webhook
router.get('/dodo-products', paymentsController.getDodoProducts);
// Get all payments for organization
router.get('/organization/:organizationId', paymentsController.getOrganizationPayments);

module.exports = router;
