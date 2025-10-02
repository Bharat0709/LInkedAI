const mongoose = require('mongoose');
const { newDBConnection } = require('../config/db');

const paymentSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    sessionId: { type: String, required: true },
    productId: { type: String, required: true },
    dodoPaymentId: { type: String }, // Dodo payment ID
    paymentLink: { type: String },
    paymentMethod: { type: String }, // e.g., 'upi', 'card'
    paymentMethodType: { type: String }, // e.g., 'upi_intent'
    amount: { type: Number }, // Total amount in smallest currency unit
    currency: { type: String, default: 'INR' },
    status: { type: String, default: 'created' }, // created, succeeded, failed
    settlementAmount: { type: Number }, // amount settled after taxes
    settlementCurrency: { type: String },
    settlementTax: { type: Number },
    metadata: {
      organizationId: { type: String },
      product_id: { type: String },
      order_id: { type: String }, // optional custom metadata
      source: { type: String },
    },
    customer: {
      customerId: { type: String },
      name: { type: String },
      email: { type: String },
      phone_number: { type: String },
    },
    billing: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      zipcode: { type: String },
    },
    digitalProductsDelivered: { type: Boolean, default: false },
    refunds: [
      {
        refundId: String,
        amount: Number,
        status: String,
        createdAt: Date,
      },
    ],
    subscriptionId: { type: String, default: null },
    type: { type: String, default: 'payment' }, // payload type
    rawPayload: { type: Object }, // store full payload for reference/logs
  },
  { timestamps: true }
);

const Payment = newDBConnection.model('Payment', paymentSchema);
module.exports = Payment;
