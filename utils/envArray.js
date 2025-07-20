// utils/envArray.js

const dotenv = require('dotenv');
dotenv.config();
module.exports = (key, fallback = []) => (process.env[key] ? process.env[key].split(',').map(s => s.trim()) : fallback);
