// config/database.js
const mongoose = require('mongoose');

const createConnections = () => {
  const DB = process.env.DATABASE;

  if (!DB) {
    console.error('Database URLs are missing in environment variables!');
    process.exit(1);
  }

  const newDBConnection = mongoose.createConnection(DB, {});

  newDBConnection.on('connected', () => {
    console.log('Connected to MongoDB (N)');
  });

  newDBConnection.on('error', error => {
    console.error('New MongoDB Connection Error:', error);
  });
  return { newDBConnection };
};

const connections = createConnections();
module.exports = connections;
