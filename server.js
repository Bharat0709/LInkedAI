const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const { redisClient } = require('./config/redis');
require('./config/db');

const PORT = Number(process.env.PORT) || 8000;
const TimeZone = (process.env.TZ = 'UTC');

(async () => {
  try {
    await redisClient.connect();
    console.log('✅ Redis connected at startup');

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV.toUpperCase()}`);
      console.log('🕒 Server Time Zone:', TimeZone);
    });

    const shutdown = async signal => {
      console.log(`\n🛑 Received ${signal}. Shutting down...`);

      try {
        await redisClient.quit();
        console.log('✅ Redis connection closed.');
      } catch (err) {
        console.error('⚠️ Error closing Redis:', err);
      }

      server.close(() => {
        console.log('✅ HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    process.on('uncaughtException', err => {
      console.error('🔥 Uncaught Exception:', err.message);
      process.exit(1);
    });

    process.on('unhandledRejection', err => {
      console.error('🔥 Unhandled Rejection:', err.message);
      server.close(() => {
        process.exit(1);
      });
    });
  } catch (e) {
    console.error('❌ Fatal server error:', e);
    process.exit(1);
  }
})();
