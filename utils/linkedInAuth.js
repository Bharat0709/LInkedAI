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

const encryptToken = (token) => {
  const iv = generateIV();
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(process.env.ENCRYPTION_KEY),
    iv
  );
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + encrypted;
};

const decryptToken = (encryptedToken) => {
  const iv = Buffer.from(encryptedToken.substr(0, 32), 'hex');
  const encryptedMessage = encryptedToken.substr(32);
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(process.env.ENCRYPTION_KEY),
    iv
  );
  let decrypted = decipher.update(encryptedMessage, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

module.exports = { decryptToken, encryptToken, generateState };
