// const Redis = require('ioredis');
// const dotenv = require('dotenv');
// dotenv.config();

// const redisConfig = {
//   host: process.env.REDIS_HOST || 'localhost',
//   port: process.env.REDIS_PORT || 6379,
//   password: process.env.REDIS_PASSWORD || undefined,
//   retryDelayOnFailover: 100,
//   enableReadyCheck: false,
//   lazyConnect: true,
//   maxRetriesPerRequest: 3,
//   connectTimeout: 10000,
//   commandTimeout: 5000,
//   ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
// };

// const redisClient = new Redis(redisConfig);

// redisClient.on('connect', () => {
//   console.log('✅ Redis connected successfully');
// });

// redisClient.on('error', (err) => {
//   console.error('❌ Redis connection error:', err);
// });

// redisClient.on('ready', () => {
//   console.log('✅ Redis is ready to accept commands');
// });

// redisClient.on('reconnecting', () => {
//   console.log('🔄 Redis reconnecting...');
// });

// module.exports = { redisClient, redisConfig };
