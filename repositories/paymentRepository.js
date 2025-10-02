const Payment = require('../models/paymentModel');

// Create payment record
const createPayment = async data => {
  return await Payment.create(data);
};

// Update payment status
const updatePaymentStatus = async (sessionId, status) => {
  return await Payment.findOneAndUpdate({ sessionId }, { status }, { new: true });
};

// Find payments by organization
const findPaymentsByOrganization = async organizationId => {
  return await Payment.find({ organizationId }).sort({ createdAt: -1 });
};

// Find payment by session ID
const findPaymentBySessionId = async sessionId => {
  return await Payment.findOne({ sessionId });
};

module.exports = {
  createPayment,
  updatePaymentStatus,
  findPaymentsByOrganization,
  findPaymentBySessionId,
};
