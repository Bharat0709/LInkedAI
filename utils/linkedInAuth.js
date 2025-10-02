const crypto = require('crypto');
const dotenv = require('dotenv');
const generateIV = () => crypto.randomBytes(16);
dotenv.config();

if (!process.env.ENCRYPTION_KEY) {
  console.error('ENCRYPTION_KEY is missing in environment variables!');
  process.exit(1);
}

const generateState = () => {
  return crypto.randomBytes(16).toString('hex');
};

const encryptToken = token => {
  const iv = generateIV();
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(process.env.ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + encrypted;
};

const decryptToken = encryptedToken => {
  const iv = Buffer.from(encryptedToken.substr(0, 32), 'hex');
  const encryptedMessage = encryptedToken.substr(32);
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(process.env.ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedMessage, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

const validateAuthParams = params => {
  const errors = [];

  if (!params.response_type || params.response_type !== 'code') {
    errors.push('Invalid response_type');
  }

  if (!params.client_id || typeof params.client_id !== 'string') {
    errors.push('Invalid client_id');
  }

  if (
    !params.redirect_uri ||
    (process.env.NODE_ENV === 'production' &&
      !validator.isURL(params.redirect_uri, {
        protocols: ['https'],
        require_protocol: true,
      }))
  ) {
    errors.push('Invalid redirect_uri - must be HTTPS URL');
  }

  if (!params.scope || typeof params.scope !== 'string') {
    errors.push('Invalid scope');
  }

  if (!params.state || params.state.length < 32) {
    errors.push('Invalid state parameter');
  }

  return errors;
};

const validateCallbackParams = query => {
  const errors = [];

  if (!query.code || typeof query.code !== 'string' || query.code.length < 10) {
    errors.push('Invalid authorization code');
  }

  if (!query.state || typeof query.state !== 'string' || query.state.length < 32) {
    errors.push('Invalid state parameter');
  }

  return errors;
};

const validateEnvironmentVariables = () => {
  const requiredVars = ['LINKEDIN_BASE_URL', 'LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET', 'LINKEDIN_REDIRECT_URL', 'LINKEDIN_SCOPE', 'LINKEDIN_ACCESS_TOKEN_URL', 'LINKEDIN_USER_INFO', 'CLIENT_URL'];

  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate URLs are HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    const urlVars = ['LINKEDIN_REDIRECT_URL', 'CLIENT_URL', 'LINKEDIN_BASE_URL', 'LINKEDIN_ACCESS_TOKEN_URL', 'LINKEDIN_USER_INFO'];
    urlVars.forEach(varName => {
      if (process.env[varName] && !process.env[varName].startsWith('https://')) {
        throw new Error(`${varName} must use HTTPS in production`);
      }
    });
  }
};

// CSRF token generation and validation
const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

try {
  validateEnvironmentVariables();
} catch (error) {
  console.error('Environment validation failed:', error.message);
  process.exit(1);
}

module.exports = { decryptToken, encryptToken, generateState, validateAuthParams, validateCallbackParams, generateCSRFToken };
