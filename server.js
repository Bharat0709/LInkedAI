const dotenv = require('dotenv');
const app = require('./app');
dotenv.config();
require('./db');

const PORT = Number(process.env.PORT) || 8000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Current Environment: ${process.env.NODE_ENV.toUpperCase()}`);
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('Closed all remaining connections.');
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT')); // For Ctrl + C
process.on('SIGTERM', () => shutdown('SIGTERM')); // For deployment shutdown

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  server.close(() => {
    process.exit(1);
  });
});
