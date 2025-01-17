// config/database.js
const mongoose = require('mongoose');

const createConnections = () => {
  const DB = process.env.DATABASE;
  const OLD_DB = process.env.OLD_DATABASE;

  if (!DB || !OLD_DB) {
    console.error('Database URLs are missing in environment variables!');
    process.exit(1);
  }

  const newDBConnection = mongoose.createConnection(DB, {});
  const oldDBConnection = mongoose.createConnection(OLD_DB, {});

  newDBConnection.on('connected', () => {
    console.log('Connected to MongoDB (N)');
  });

  newDBConnection.on('error', (error) => {
    console.error('New MongoDB Connection Error:', error);
  });

  oldDBConnection.on('connected', () => {
    console.log('Connected to MongoDB (O)');
  });

  oldDBConnection.on('error', (error) => {
    console.error('Old MongoDB Connection Error:', error);
  });

  return { newDBConnection, oldDBConnection };
};

const connections = createConnections();
module.exports = connections;
