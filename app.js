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
const hiringPostsRouter = require('./routes/hiringPosts');
const MongoStore = require('connect-mongo');
const postRouter = require('./routes/postsRoutes');
const scheduler = require('./controllers/linkedInController');
const reportScheduler = require('./controllers/reportController');
const postScheduledPosts = scheduler.schedulePosts;
const generateReport = reportScheduler.generateDailyReport;
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cron = require('node-cron');
const app = express();
const DB = process.env.DATABASE;

const NODE_ENV = process.env.NODE_ENV || 'development';

// Session store configuration with error handling
const sessionStore = MongoStore.create({
  mongoUrl: DB,
  ttl: 24 * 60 * 60,
  touchAfter: 24 * 3600,
  collectionName: 'userSessions',
  autoRemove: 'interval',
  autoRemoveInterval: 24 * 60,
  mongoOptions: {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  },
});

sessionStore.on('error', function (error) {
  console.error('Session Store Error:', error);
});

// Enhanced CORS configuration
const corsOptions = {
  origin:
    NODE_ENV === 'production'
      ? [
          'https://www.engagegpt.in',
          'https://engagegpt.in',
          'https://api.engagegpt.in',
          'https://www.linkedin.com',
          /^chrome-extension:\/\/.*/,
        ]
      : NODE_ENV === 'staging'
      ? [
          'https://staging.engagegpt.in',
          'https://api.staging.engagegpt.in',
          'https://www.linkedin.com',
          /^chrome-extension:\/\/.*/,
        ]
      : [
          'http://localhost:3000',
          'https://api.staging.engagegpt.in',
          'https://www.linkedin.com',
          /^chrome-extension:\/\/.*/,
        ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Cookie',
    'X-Requested-With',
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// Session configuration
const sessionConfig = {
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    domain: process.env.NODE_ENV === 'production' ? '.engagegpt.in' : undefined,
    path: '/',
  },
  name: 'sessionId',
  proxy: process.env.NODE_ENV === 'production',
  rolling: true, // Refresh session with each request
};

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

cron.schedule('* * * * *', () => {
  console.log('⏳ Running scheduled post check...');
  postScheduledPosts();
});

cron.schedule('30 11 * * *', async () => {
  console.log('📊 Running daily user report job at 11:30 AM...');
  try {
    await generateReport();
    console.log('✅ Daily user report job completed successfully.');
  } catch (error) {
    console.error('❌ Error running daily report job:', error);
  }
});

app.use(helmet());

// Apply rate limiting
app.use('/api/', limiter);

// CORS configuration
app.use(cors(corsOptions));
app.use(cookieParser());

// Body parsing middleware with size limits
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));
app.use(bodyParser.json({ limit: '30mb' }));

// Static files serving
app.use(express.static(path.join(__dirname, 'build')));
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(session(sessionConfig));

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Session monitoring middleware
app.use((req, res, next) => {
  if (req.session) {
    req.session.touch();
  }
  next();
});

// Serving static files
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
app.use('/api/v1/hiring-posts', hiringPostsRouter);
app.use('/api/v1/auth', authRouter);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is healthy',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Default route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Server is up and running',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Handle undefined routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// Global error handling middleware
app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Don't leak error details in production
  if (NODE_ENV === 'production') {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.isOperational ? err.message : 'Something went wrong!',
    });
  } else {
    // Development error response with full error details
    console.error('ERROR 💥', err);
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
});

// Logging configuration
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  // Use combined format for production logging
  app.use(
    morgan('combined', {
      skip: function (req, res) {
        return res.statusCode < 400;
      }, // Log only errors
    })
  );
}

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  // Create a timeout for force shutdown
  const forcedShutdownTimeout = setTimeout(() => {
    console.error(
      'Could not close connections in time, forcefully shutting down'
    );
    process.exit(1);
  }, 30000);

  // Attempt graceful shutdown
  server.close(() => {
    console.log('HTTP server closed');

    // Close MongoDB connections
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      clearTimeout(forcedShutdownTimeout);
      process.exit(0);
    });
  });
};

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err);
  process.exit(1);
});

module.exports = app;
