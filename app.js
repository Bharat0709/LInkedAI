const morgan = require('morgan');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const bodyParser = require('body-parser');
const AppError = require('./utils/appError');
const memberRouter = require('./routes/membersRoutes');
const authRouter = require('./routes/authRoutes');
const organizationRouter = require('./routes/organizationRoutes');
const aiRouter = require('./routes/AIAPIRoutes');
const mailRouter = require('./routes/mailRoutes');
const postRouter = require('./routes/postsRoutes');
const app = express();

const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://192.168.0.115:3000',
    'https://www.linkedin.com',
    'chrome-extension://jhimkoakppegefmkecmgabjcbhbokiba',
  ],
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type,Authorization',
};

app.use(cors(corsOptions));
app.use(cookieParser());

app.use(express.json());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'build')));

app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'favicon.ico'));
});

app.get('/manifest.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'manifest.json'));
});

app.use('/api/v1/organization/auth', organizationRouter);
app.use('/api/v1/members', memberRouter);
app.use('/api/v1/mail', mailRouter);
app.use('/api/v1/ai', aiRouter);
app.use('/api/v1/posts', postRouter);
app.use('/api/v1/auth', authRouter);

app.get('/api/v1/health', (req, res) => {
  console.log('Server is up and running');
  res.status(200).json({
    message: 'Server is up and running',
  });
});

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`), 404);
});

app.use((err, req, res, next) => {
  console.log('ERROR:', err);
  res.status(err.statusCode || 500).json({
    status: err.status || 'error',
    message: err.message || 'Something went wrong!',
  });
});

app.use(express.static('public'));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

module.exports = app;
