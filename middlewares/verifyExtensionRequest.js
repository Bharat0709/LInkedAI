// middlewares/verifyExtensionRequest.js
require('dotenv').config();
const { redisClient } = require('../config/redis');
const catchAsync = require('../utils/catchAsync');

const MAX_CLOCK_SKEW_MS = 2 * 60 * 1000;
const NONCE_TTL_SEC = parseInt(process.env.NONCE_TTL_SEC, 10) || 120;
const NONCE_PATTERN = /^engage-[A-Za-z0-9]{16}-gpt$/;

const isFreshNonce = async nonce => {
  const ok = await redisClient.set(nonce, '1', 'NX', 'EX', NONCE_TTL_SEC);
  return ok === 'OK';
};

exports.verifyExtension = catchAsync(async (req, res, next) => {
  try {
    const extensionId = req.headers['x-extension-id'];
    const timestamp = parseInt(req.headers['x-timestamp'], 10);
    const nonce = req.headers['x-engagegpt-nonce'];
    const originHeader = req.headers.origin;
    const fetchSite = req.headers['sec-fetch-site'];
    const allowedId = process.env.ALLOWED_EXTENSION_ID;
    console.log(extensionId, timestamp, nonce, originHeader, allowedId);

    // 1. Validate Extension ID
    if (!extensionId || extensionId !== allowedId) {
      return res.status(403).json({ error: 'Unauthorized extension ID' });
    }

    // 2. Validate Origin
    const expectedOrigin = `chrome-extension://${allowedId}` || 'http://localhost:8000';
    console.log(originHeader);
    const originIsValid =
      (originHeader && originHeader === expectedOrigin) || (fetchSite && (fetchSite === 'none' || fetchSite === 'same-origin')) || originHeader === 'https://www.linkedin.com' || originHeader === 'http://localhost:8000';

    if (!originIsValid) {
      return res.status(403).json({ error: 'Invalid request origin' });
    }

    // 3. Validate Timestamp
    if (!timestamp || Math.abs(Date.now() - timestamp) > MAX_CLOCK_SKEW_MS) {
      return res.status(401).json({ error: 'Stale or missing timestamp' });
    }

    // 4. Validate Nonce Pattern
    if (!nonce || !NONCE_PATTERN.test(nonce)) {
      return res.status(400).json({ error: 'Invalid EngageGPT format' });
    }

    // 5. Check if Nonce is Fresh
    if (!(await isFreshNonce(nonce))) {
      return res.status(401).json({ error: 'Replay attack detected' });
    }

    return next();
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
