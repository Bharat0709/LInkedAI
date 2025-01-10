// config/database.js
const mongoose = require('mongoose');

const createConnections = () => {
  const DB = process.env.DATABASE;
  const OLD_DB = process.env.OLD_DATABASE;

  const newDBConnection = mongoose.createConnection(DB, {});
  const oldDBConnection = mongoose.createConnection(OLD_DB, {});

  newDBConnection.on('connected', () => {
    console.log('Connected to New MongoDB Database');
  });

  newDBConnection.on('error', (error) => {
    console.error('New MongoDB Connection Error:', error);
  });

  oldDBConnection.on('connected', () => {
    console.log('Connected to Old MongoDB Database');
  });

  oldDBConnection.on('error', (error) => {
    console.error('Old MongoDB Connection Error:', error);
  });

  return { newDBConnection, oldDBConnection };
};

const connections = createConnections();
module.exports = connections;
