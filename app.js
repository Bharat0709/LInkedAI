require('dotenv').config();
const morgan = require('morgan');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const bodyParser = require('body-parser');
const AppError = require('./utils/appError');
const session = require('express-session');
const memberRouter = require('./routes/membersRoutes');
const authRouter = require('./routes/authRoutes');
const organizationRouter = require('./routes/organizationRoutes');
const aiRouter = require('./routes/AIAPIRoutes');
const mailRouter = require('./routes/mailRoutes');
const postRouter = require('./routes/postsRoutes');
const passport = require('passport');
const app = express();

const NODE_ENV = process.env.NODE_ENV || 'development';

const corsOptions = {
  origin:
    NODE_ENV === 'production'
      ? ['https://engagegpt.in', 'https://www.linkedin.com']
      : NODE_ENV === 'staging'
      ? [
          'https://engagegpt-61cwiegr3-bharat0709s-projects.vercel.app',
          'https://www.linkedin.com',
        ]
      : [
          'http://localhost:3000',
          'https://www.linkedin.com',
          'chrome-extension://jhimkoakppegefmkecmgabjcbhbokiba',
        ],
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type,Authorization',
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'build')));

app.use(
  session({
    secret: process.env.JWT_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: NODE_ENV === 'production' },
  })
);

app.use(passport.initialize());
app.use(passport.session());

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

// Health check route
app.get('/', (req, res) => {
  console.log('Server is up and running');
  res.status(200).json({
    message: 'Server is up and running',
  });
});

// Error handling
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`), 404);
});

app.use((err, req, res, next) => {
  console.error('ERROR:', err);
  res.status(err.statusCode || 500).json({
    status: err.status || 'error',
    message: err.message || 'Something went wrong!',
  });
});

// Enable static files
app.use(express.static('public'));

// Use morgan only in development
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Export app
module.exports = app;
