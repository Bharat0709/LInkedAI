require('dotenv').config();
const morgan = require('morgan');
const express = require('express');
const cors = require('cors');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const helmet = require('helmet');
const cron = require('node-cron');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const masterData = require('./masterData.json');
const envArray = require('./utils/envArray');

// UTILS
const AppError = require('./utils/appError');

// ROUTES
const geminiRouter = require('./routes/geminiRoutes');
const openaiRouter = require('./routes/openAIRoutes');
const authRouter = require('./routes/authRoutes');
const postRouter = require('./routes/postsRoutes');
const linkedinRouter = require('./routes/linkedinRoutes');
const calendarRouter = require('./routes/calendarRoutes');
const memberRouter = require('./routes/membersRoutes');
const savedPostsRouter = require('./routes/savedPostRoutes');
const organizationRouter = require('./routes/organizationRoutes');
const emailTemplateRouter = require('./routes/emailTemplateRoutes');
const automationRouter = require('./routes/automations');
const paymentRouter = require('./routes/paymentsRoutes');
const adminRouter = require('./routes/adminRoutes');

const { initCreditExpiryCronJobs } = require('./cron/creditExpiryCron');
// CONTROLLERS
const scheduler = require('./controllers/LinkedIn/linkedInController');
const { generateAndSendStats } = require('./middlewares/reportMiddleware');

const app = express();

// ENVIRONMENT VARIABLES
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
  origin: envArray('CORS_ORIGINS'),
  methods: envArray('CORS_METHODS', ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']),
  allowedHeaders: envArray('CORS_ALLOWED_HEADERS'),
  credentials: true,
  maxAge: parseInt(process.env.CORS_MAX_AGE || '86400', 10),
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
    secure: process.env.COOKIE_SECURE === 'true',
    httpOnly: true,
    maxAge: 86400000,
    sameSite: process.env.COOKIE_SAMESITE || 'lax',
    domain: process.env.COOKIE_DOMAIN || undefined,
    path: '/',
  },
  name: 'sessionId',
  proxy: process.env.COOKIE_SECURE === 'true',
  rolling: true,
};

const createRateLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      console.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({ error: message });
    },
  });

const limiter = createRateLimiter(15 * 60 * 1000, 200, 'Too many requests from this IP, please try again later.');
const authLimiter = createRateLimiter(15 * 60 * 1000, 10, 'Too many authentication attempts, please try again later.');
const aiLimiter = createRateLimiter(15 * 60 * 1000, 20, 'Too many ai generation attempts, please try again later.');

cron.schedule('* * * * *', () => {
  console.log('⏳ Running scheduled post check...');
  scheduler.processScheduledPosts();
});

initCreditExpiryCronJobs();

cron.schedule(
  '30 10 * * *',
  () => {
    console.log('📊 Running daily stats report...');
    generateAndSendStats();
  },
  {
    timezone: 'Asia/Kolkata',
  }
);

app.use(cors(corsOptions));
app.use(helmet());
app.use(compression());
app.use(mongoSanitize());
app.use(xss());
app.use(
  hpp({
    whitelist: ['sort', 'fields', 'page', 'limit'],
  })
);

app.use('/api/', limiter);
app.use('/api/v1/auth', authLimiter);
app.use('/api/v1/ai', aiLimiter);
app.use('/api/v1/openai', aiLimiter);
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(bodyParser.json({ limit: '10mb' }));

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

// API Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/organization', organizationRouter);
app.use('/api/v1/linkedin', linkedinRouter);
app.use('/api/v1/calendar', calendarRouter);
app.use('/api/v1/member', memberRouter);
app.use('/api/v1/ai', geminiRouter);
app.use('/api/v1/email-templates', emailTemplateRouter);
app.use('/api/v1/openai', openaiRouter);
app.use('/api/v1/posts', postRouter);
app.use('/api/v1/saved-posts', savedPostsRouter);
app.use('/api/v1/automation', automationRouter);
app.use('/api/v1/payments', paymentRouter);
app.use('/api/v1/admin', adminRouter);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is healthy',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/v1/master-data', (req, res) => {
  res.status(200).json({ masterData });
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

  if (NODE_ENV === 'production') {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.isOperational ? err.message : 'Something went wrong!',
    });
  } else {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
});

if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(
    morgan('combined', {
      skip: function (req, res) {
        return res.statusCode < 400;
      },
    })
  );
}

// Graceful shutdown handling
const gracefulShutdown = signal => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  // Create a timeout for force shutdown
  const forcedShutdownTimeout = setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
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
process.on('unhandledRejection', err => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', err => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err);
  process.exit(1);
});

module.exports = app;
