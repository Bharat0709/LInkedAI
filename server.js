const app = require('./app');
const dotenv = require('dotenv');
const os = require('os');
const mongoose = require('mongoose');
dotenv.config();
const port = process.env.PORT || 8000;

dotenv.config({ path: './.env' });
const DB = process.env.DATABASE;
// Get local IP address
const getLocalIp = () => {
  const networkInterfaces = os.networkInterfaces();
  for (const interfaceName in networkInterfaces) {
    // @ts-ignore
    for (const address of networkInterfaces[interfaceName]) {
      if (address.family === 'IPv4' && !address.internal) {
        return address.address;
      }
    }
  }
  return '127.0.0.1';
};

const PORT = Number(process.env.PORT) || 8000;
const ipAddress = getLocalIp();

app.listen(PORT, () => {
  console.log(`Server running on http://${ipAddress}:${PORT}`);
});

mongoose.connect(DB);

const db = mongoose.connection;

db.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});

db.once('open', () => {
  console.log('Connected to MongoDB');
});

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
