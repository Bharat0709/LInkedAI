const dotenv = require('dotenv');
dotenv.config();

const emailConfig = {
  queue: {
    name: 'send-mail',
    concurrency: parseInt(process.env.EMAIL_WORKER_CONCURRENCY) || 5,
    attempts: parseInt(process.env.EMAIL_RETRY_ATTEMPTS) || 3,
    backoffDelay: parseInt(process.env.EMAIL_BACKOFF_DELAY) || 2000,
    removeOnComplete: parseInt(process.env.REMOVE_ON_COMPLETE) || 10,
    removeOnFail: parseInt(process.env.REMOVE_ON_FAIL) || 50,
  },
  cleanup: {
    completedJobTTL:
      parseInt(process.env.COMPLETED_JOB_TTL) || 24 * 60 * 60 * 1000, // 24 hours
    failedJobTTL:
      parseInt(process.env.FAILED_JOB_TTL) || 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  monitoring: {
    statsInterval: parseInt(process.env.QUEUE_STATS_INTERVAL) || 30000, // 30 seconds
    healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 60000, // 1 minute
  },
  priorities: {
    CRITICAL: 10, // Password reset, security
    HIGH: 8, // Password changed, help requests
    MEDIUM: 5, // Invites, notifications
    LOW: 3, // General emails
    BACKGROUND: 1, // Milestones, analytics
  },
};

module.exports = emailConfig;
