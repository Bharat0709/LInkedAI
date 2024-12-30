const app = require('./app');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const DB = process.env.DATABASE;
const PORT = Number(process.env.PORT) || 8000;

dotenv.config();
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
  console.log(`Server started in ${process.env.NODE_ENV}`);
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
