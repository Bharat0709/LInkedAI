// const Queue = require('bull');
// const { redisConfig } = require('../config/redis');
// const emailConfig = require('../config/emailConfig');
// const dotenv = require('dotenv');
// dotenv.config();

// // Create email queue with enhanced configuration
// const emailQueue = new Queue(emailConfig.queue.name, {
//   redis: redisConfig,
//   defaultJobOptions: {
//     removeOnComplete: emailConfig.queue.removeOnComplete,
//     removeOnFail: emailConfig.queue.removeOnFail,
//     attempts: emailConfig.queue.attempts,
//     backoff: {
//       type: 'exponential',
//       delay: emailConfig.queue.backoffDelay,
//     },
//     delay: 0,
//   },
//   settings: {
//     stalledInterval: 30 * 1000, // 30 seconds
//     maxStalledCount: 1, // Retry stalled jobs once
//   },
// });

// // Enhanced queue event listeners
// emailQueue.on('completed', (job, result) => {
//   console.log(
//     `✅ [${new Date().toISOString()}] Email job ${job.id} completed:`,
//     {
//       type: job.data.type,
//       email: job.data.data.email || job.data.data.MemberEmail || 'admin',
//       duration: Date.now() - job.timestamp,
//       attempts: job.attemptsMade,
//     }
//   );
// });

// emailQueue.on('failed', (job, err) => {
//   console.error(
//     `❌ [${new Date().toISOString()}] Email job ${job.id} failed:`,
//     {
//       type: job.data.type,
//       email: job.data.data.email || job.data.data.MemberEmail || 'admin',
//       error: err.message,
//       attempts: job.attemptsMade,
//       maxAttempts: job.opts.attempts,
//     }
//   );
// });

// emailQueue.on('stalled', (job) => {
//   console.warn(
//     `⚠️ [${new Date().toISOString()}] Email job ${job.id} stalled:`,
//     {
//       type: job.data.type,
//       email: job.data.data.email || job.data.data.MemberEmail || 'admin',
//     }
//   );
// });

// emailQueue.on('active', (job) => {
//   console.log(
//     `🔄 [${new Date().toISOString()}] Email job ${job.id} started processing:`,
//     {
//       type: job.data.type,
//       priority: job.opts.priority,
//     }
//   );
// });

// emailQueue.on('waiting', (jobId) => {
//   console.log(
//     `⏳ [${new Date().toISOString()}] Email job ${jobId} added to queue`
//   );
// });

// emailQueue.on('error', (error) => {
//   console.error('❌ Email queue error:', error);
// });

// // Graceful shutdown
// const gracefulShutdown = async () => {
//   console.log('🔄 Closing email queue...');
//   try {
//     await emailQueue.close();
//     console.log('✅ Email queue closed successfully');
//   } catch (error) {
//     console.error('❌ Error closing email queue:', error);
//   }
// };

// process.on('SIGTERM', gracefulShutdown);
// process.on('SIGINT', gracefulShutdown);

// module.exports = emailQueue;
