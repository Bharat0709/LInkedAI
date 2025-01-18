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
const MongoStore = require('connect-mongo');
const postRouter = require('./routes/postsRoutes');
const passport = require('passport');
const app = express();
const DB = process.env.DATABASE;

const NODE_ENV = process.env.NODE_ENV || 'development';

const corsOptions = {
  origin:
    NODE_ENV === 'production'
      ? [
          'https://www.engagegpt.in',
          'https://www.linkedin.com',
          /^chrome-extension:\/\/.*/,
        ]
      : NODE_ENV === 'staging'
      ? [
          'https://staging.engagegpt.in',
          'https://www.linkedin.com',
          /^chrome-extension:\/\/.*/,
        ]
      : [
          'http://localhost:3000',
          'https://www.linkedin.com',
          /^chrome-extension:\/\/.*/,
        ],
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(cookieParser());

// Parsing Request Body (30mb limit, adjust if needed)
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));
app.use(bodyParser.json());

// Static Files (serve build folder or public assets)
app.use(express.static(path.join(__dirname, 'build')));
app.use(express.static(path.join(__dirname, 'public')));

// In your app.js, update the session configuration
app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false, // Change to false to avoid creating empty sessions
    store: MongoStore.create({
      mongoUrl: DB,
      ttl: 24 * 60 * 60,
      touchAfter: 24 * 3600,
      collectionName: 'userSessions',
      autoRemove: 'interval',
      autoRemoveInterval: 24 * 60,
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Add sameSite configuration
      domain:
        process.env.NODE_ENV === 'production' ? 'engagegpt.in' : undefined,
    },
    name: 'sessionId',
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Serving Manifest and Favicon
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'favicon.ico'));
});
app.get('/manifest.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'manifest.json'));
});

// API Routes
app.use('/api/v1/organization', organizationRouter);
app.use('/api/v1/members', memberRouter);
app.use('/api/v1/mail', mailRouter);
app.use('/api/v1/ai', aiRouter);
app.use('/api/v1/posts', postRouter);
app.use('/api/v1/auth', authRouter);

// Default Route for Health Check
app.get('/', (req, res) => {
  console.log('Server is up and running');
  res.status(200).json({
    message: 'Server is up and running',
  });
});

// Handle Undefined Routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`), 404);
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err); // Log error details for debugging (do not expose sensitive details in production)
  res.status(err.statusCode || 500).json({
    status: err.status || 'error',
    message: err.message || 'Something went wrong!',
  });
});

// Logging Middleware (only in development mode)
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  // For production, log critical requests or errors only
  app.use(morgan('combined'));
}

// Graceful Shutdown: Catch SIGTERM & SIGINT signals and shutdown the server gracefully
const shutdown = (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('Closed all remaining connections.');
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = app;
