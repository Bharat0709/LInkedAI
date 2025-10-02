const crypto = require('crypto');

// Verify webhook signature
const verifyWebhookSignature = (signature, payload, secret) => {
  const expectedSignature = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');

  return signature === expectedSignature;
};

module.exports = { verifyWebhookSignature };
