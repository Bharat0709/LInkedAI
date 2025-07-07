// // ===== ENHANCED EMAIL WORKER WITH DEBUG FIXES =====
// const emailQueue = require('../queues/emailQueue');
// const emailConfig = require('../config/emailConfig');

// const {
//   sendNewMemberInviteEmail,
//   sendPostStatusEmail,
//   sendExtensionConnectedConfirmation,
//   sendOnboardingCompleteEmail,
//   sendMilestoneEmail,
// } = require('../services/email/member');

// const {
//   sendResetPasswordURL,
//   sendPasswordChangedConfirmation,
//   sendWelcomeEmail,
// } = require('../services/email/organization');

// const {
//   sendSurveyForm,
//   sendNewUserEmail,
//   helpRequest,
//   feedback,
// } = require('../services/email/admin');

// class EmailWorker {
//   constructor() {
//     this.isProcessorRegistered = false;
//     this.isReady = false;
//     this.debugMode = process.env.NODE_ENV === 'development';
//   }

//   async start() {
//     console.log('🔥 EMAIL WORKER PROCESS STARTED');
//     console.log('📍 Worker PID:', process.pid);
//     console.log('📍 Current working directory:', process.cwd());
//     console.log('📍 Worker concurrency:', emailConfig.queue.concurrency || 5);
//     console.log('📍 Max attempts per job:', emailConfig.queue.attempts || 3);
//     console.log('📍 Debug mode:', this.debugMode);

//     try {
//       // Step 1: Ensure Redis connection
//       await this.ensureRedisConnection();

//       // Step 2: Clean up any potential issues
//       await this.cleanupQueue();

//       // Step 3: Register processor with proper error handling
//       await this.registerProcessor();

//       // Step 4: Setup event listeners
//       this.setupEventListeners();

//       // Step 5: Force process existing jobs
//       await this.forceProcessExistingJobs();

//       // Step 6: Start monitoring
//       this.startMonitoring();

//       console.log('✅ EMAIL WORKER FULLY OPERATIONAL');
//     } catch (error) {
//       console.error('❌ Failed to start email worker:', error);
//       process.exit(1);
//     }
//   }

//   async ensureRedisConnection() {
//     console.log('🔍 Ensuring Redis connection...');

//     try {
//       // Test Redis connection with timeout
//       const result = await Promise.race([
//         new Promise((resolve, reject) => {
//           emailQueue.client.ping((err, result) => {
//             if (err) reject(err);
//             else resolve(result);
//           });
//         }),
//         new Promise((_, reject) =>
//           setTimeout(() => reject(new Error('Redis ping timeout')), 5000)
//         ),
//       ]);

//       if (result === 'PONG') {
//         console.log('✅ Redis connection verified');
//         this.isReady = true;

//         // Additional Redis info
//         if (this.debugMode) {
//           const info = await new Promise((resolve, reject) => {
//             emailQueue.client.info('server', (err, result) => {
//               if (err) reject(err);
//               else resolve(result);
//             });
//           });
//           console.log('📊 Redis server info:', info.split('\r\n')[1]); // Redis version line
//         }
//       }
//     } catch (error) {
//       console.error('❌ Redis connection failed:', error);
//       throw error;
//     }
//   }

//   async cleanupQueue() {
//     console.log('🧹 Cleaning up queue...');

//     try {
//       // Remove any stalled jobs
//       const stalledJobs = await emailQueue.getActive();
//       if (stalledJobs.length > 0) {
//         console.log(`🔧 Found ${stalledJobs.length} potentially stalled jobs`);
//         for (const job of stalledJobs) {
//           try {
//             await job.remove();
//             console.log(`🗑️ Removed stalled job ${job.id}`);
//           } catch (err) {
//             console.log(`⚠️ Could not remove job ${job.id}:`, err.message);
//           }
//         }
//       }

//       // Ensure queue is not paused
//       await emailQueue.resume();
//       console.log('▶️ Queue resumed during cleanup');
//     } catch (error) {
//       console.error('❌ Error during cleanup:', error);
//       // Don't throw - continue with startup
//     }
//   }

//   async registerProcessor() {
//     if (this.isProcessorRegistered) {
//       console.log('⚠️ Processor already registered');
//       return;
//     }

//     console.log('🎯 Registering job processor...');

//     try {
//       // Method 1: Try registering without job name (process all jobs)
//       console.log('🔧 Attempting Method 1: Process all jobs');
//       emailQueue.process(emailConfig.queue.concurrency || 5, async (job) => {
//         console.log(
//           `🎯 PROCESSOR INVOKED for job ${job.id}, name: "${job.name}", type: "${job.data?.type}"`
//         );
//         return await this.processEmailJob(job);
//       });

//       // Wait a moment and test
//       await new Promise((resolve) => setTimeout(resolve, 100));
//       let listeners = emailQueue.listeners('process');
//       console.log(`📊 Method 1 - Process listeners count: ${listeners.length}`);

//       if (listeners.length === 0) {
//         console.log('🔧 Method 1 failed, trying Method 2: Named job processor');

//         // Method 2: Try with job name
//         emailQueue.process(
//           'send-email',
//           emailConfig.queue.concurrency || 5,
//           async (job) => {
//             console.log(`🎯 NAMED PROCESSOR INVOKED for job ${job.id}`);
//             return await this.processEmailJob(job);
//           }
//         );

//         await new Promise((resolve) => setTimeout(resolve, 100));
//         listeners = emailQueue.listeners('process');
//         console.log(
//           `📊 Method 2 - Process listeners count: ${listeners.length}`
//         );
//       }

//       if (listeners.length === 0) {
//         console.log('🔧 Method 2 failed, trying Method 3: Direct listener');

//         // Method 3: Manual event listener approach
//         emailQueue.on('waiting', async (jobId) => {
//           console.log(`🔔 Job ${jobId} waiting - manually processing`);
//           try {
//             const job = await emailQueue.getJob(jobId);
//             if (job) {
//               console.log(`🔧 Found job ${jobId}, processing manually...`);
//               const result = await this.processEmailJob(job);
//               await job.moveToCompleted(result);
//               console.log(`✅ Manually completed job ${jobId}`);
//             }
//           } catch (error) {
//             console.error(
//               `❌ Manual processing failed for job ${jobId}:`,
//               error
//             );
//           }
//         });

//         listeners = emailQueue.listeners('waiting');
//         console.log(
//           `📊 Method 3 - Waiting listeners count: ${listeners.length}`
//         );
//       }

//       this.isProcessorRegistered = true;
//       console.log('✅ Job processor registered successfully');

//       // Additional debugging
//       if (this.debugMode) {
//         console.log('🔍 Queue debugging info:');
//         console.log('📊 Queue name:', emailQueue.name);
//         console.log(
//           '📊 Queue client ready:',
//           emailQueue.client?.ready || 'unknown'
//         );
//         console.log('📊 All listeners:', Object.keys(emailQueue._events || {}));

//         // Test if we can get the queue instance
//         try {
//           const queueEvents = await emailQueue.getJobCounts();
//           console.log('📊 Queue counts work:', queueEvents);
//         } catch (err) {
//           console.log('❌ Queue counts failed:', err.message);
//         }
//       }
//     } catch (error) {
//       console.error('❌ Failed to register processor:', error);
//       throw error;
//     }
//   }

//   async processEmailJob(job) {
//     const startTime = Date.now();
//     const { type, data, timestamp, queuedBy } = job.data;
//     const jobId = job.id;

//     console.log(`🚀 [Job ${jobId}] PROCESSOR CALLED - Starting email job:`, {
//       type,
//       email: data.email || data.MemberEmail || 'admin',
//       attempt: job.attemptsMade + 1,
//       maxAttempts: job.opts.attempts || 3,
//       jobData: this.debugMode ? job.data : 'hidden',
//     });

//     try {
//       await job.progress(10);

//       let result;
//       console.log(`🔄 [Job ${jobId}] Processing ${type}`);
//       await job.progress(25);

//       // Add delay for testing (remove in production)
//       if (this.debugMode) {
//         console.log(`⏳ [Job ${jobId}] Debug delay...`);
//         await new Promise((resolve) => setTimeout(resolve, 1000));
//       }

//       // Route to appropriate email service
//       switch (type) {
//         case 'NEW_MEMBER_INVITE':
//           console.log(
//             `👥 [Job ${jobId}] Sending member invite to ${data.MemberEmail}`
//           );
//           result = await sendNewMemberInviteEmail(
//             data.OrganizationName,
//             data.MemberName,
//             data.MemberEmail,
//             data.ConnectionToken
//           );
//           break;

//         case 'POST_STATUS':
//           console.log(`📊 [Job ${jobId}] Sending post status to ${data.email}`);
//           result = await sendPostStatusEmail(
//             data.email,
//             data.post,
//             data.status,
//             data.errorMessage
//           );
//           break;

//         case 'EXTENSION_CONNECTED':
//           console.log(
//             `🔌 [Job ${jobId}] Sending extension connected confirmation`
//           );
//           result = await sendExtensionConnectedConfirmation(data.user);
//           break;

//         case 'ONBOARDING_COMPLETE':
//           console.log(`🎉 [Job ${jobId}] Sending onboarding complete email`);
//           result = await sendOnboardingCompleteEmail(data.user);
//           break;

//         case 'MILESTONE':
//           console.log(`🏆 [Job ${jobId}] Sending milestone email`);
//           result = await sendMilestoneEmail(data.user);
//           break;

//         case 'RESET_PASSWORD':
//           console.log(
//             `🔐 [Job ${jobId}] Sending password reset to ${data.email}`
//           );
//           result = await sendResetPasswordURL(
//             data.email,
//             data.subject,
//             data.resetURL
//           );
//           break;

//         case 'PASSWORD_CHANGED':
//           console.log(
//             `🔒 [Job ${jobId}] Sending password changed confirmation`
//           );
//           result = await sendPasswordChangedConfirmation(data.user);
//           break;

//         case 'WELCOME':
//           console.log(
//             `👋 [Job ${jobId}] Sending welcome email to ${data.email}`
//           );
//           result = await sendWelcomeEmail(data.email, data.name);
//           break;

//         case 'SURVEY_FEEDBACK':
//           console.log(`📝 [Job ${jobId}] Sending survey form to ${data.email}`);
//           result = await sendSurveyForm(
//             data.usability,
//             data.performance,
//             data.missingFeatures,
//             data.reason,
//             data.email,
//             data.overallSatisfaction
//           );
//           break;

//         case 'NEW_USER_NOTIFICATION':
//           console.log(
//             `👤 [Job ${jobId}] Sending new user notification to admin`
//           );
//           result = await sendNewUserEmail(data.user);
//           break;

//         case 'HELP_REQUEST':
//           console.log(`🆘 [Job ${jobId}] Sending help request`);
//           result = await helpRequest(data.user, data.helpMessage);
//           break;

//         case 'USER_FEEDBACK':
//           console.log(`💬 [Job ${jobId}] Sending user feedback`);
//           result = await feedback(data.user, data.rating, data.feedbackText);
//           break;

//         default:
//           throw new Error(`Unknown email type: ${type}`);
//       }

//       await job.progress(90);

//       const totalTime = Date.now() - startTime;
//       console.log(`✅ [Job ${jobId}] Email sent successfully:`, {
//         type,
//         email: data.email || data.MemberEmail || 'admin',
//         totalTime: `${totalTime}ms`,
//         attempt: job.attemptsMade + 1,
//       });

//       await job.progress(100);

//       return {
//         success: true,
//         type,
//         email: data.email || data.MemberEmail || 'admin',
//         result,
//         totalTime,
//         processedAt: new Date().toISOString(),
//         attempt: job.attemptsMade + 1,
//       };
//     } catch (error) {
//       const totalTime = Date.now() - startTime;

//       console.error(`❌ [Job ${jobId}] Email sending failed:`, {
//         type,
//         email: data.email || data.MemberEmail || 'admin',
//         error: error.message,
//         stack: this.debugMode ? error.stack : 'hidden',
//         attempt: job.attemptsMade + 1,
//         totalTime: `${totalTime}ms`,
//         willRetry: job.attemptsMade + 1 < (job.opts.attempts || 3),
//       });

//       throw error; // Re-throw to trigger Bull's retry mechanism
//     }
//   }

//   setupEventListeners() {
//     // Remove existing listeners to prevent duplicates
//     emailQueue.removeAllListeners();

//     emailQueue.on('completed', (job, result) => {
//       console.log(`🎉 [Job ${job.id}] COMPLETED:`, {
//         type: result.type,
//         email: result.email,
//         totalTime: result.totalTime,
//         attempt: result.attempt,
//       });
//     });

//     emailQueue.on('failed', (job, err) => {
//       const willRetry = job.attemptsMade < (job.opts.attempts || 3);
//       console.error(`💥 [Job ${job.id}] FAILED:`, {
//         type: job.data.type,
//         email: job.data.data.email || job.data.data.MemberEmail || 'admin',
//         error: err.message,
//         attempt: job.attemptsMade,
//         maxAttempts: job.opts.attempts || 3,
//         willRetry,
//       });
//     });

//     emailQueue.on('active', (job) => {
//       console.log(`🔄 [Job ${job.id}] ACTIVE:`, {
//         type: job.data.type,
//         email: job.data.data.email || job.data.data.MemberEmail || 'admin',
//         priority: job.opts.priority || 0,
//         startedAt: new Date().toISOString(),
//       });
//     });

//     emailQueue.on('waiting', (jobId) => {
//       console.log(`⏳ [Job ${jobId}] WAITING: Added to queue`);
//     });

//     emailQueue.on('stalled', (job) => {
//       console.warn(`⚠️ [Job ${job.id}] STALLED:`, {
//         type: job.data.type,
//         email: job.data.data.email || job.data.data.MemberEmail || 'admin',
//         stalledAt: new Date().toISOString(),
//       });
//     });

//     emailQueue.on('error', (error) => {
//       console.error('❌ Queue error:', error);
//     });

//     emailQueue.on('ready', () => {
//       console.log('✅ Queue ready event received');
//     });

//     // Add progress listener for debugging
//     if (this.debugMode) {
//       emailQueue.on('progress', (job, progress) => {
//         console.log(`📈 [Job ${job.id}] Progress: ${progress}%`);
//       });
//     }
//   }

//   async forceProcessExistingJobs() {
//     console.log('🔍 Force processing existing jobs...');

//     try {
//       const stats = await this.getQueueStats();
//       console.log('📊 Current queue status:', stats);

//       if (stats.waiting > 0) {
//         console.log(
//           `🔧 Found ${stats.waiting} waiting jobs - forcing processing`
//         );

//         // Resume queue multiple times to ensure it's active
//         await emailQueue.resume();
//         await new Promise((resolve) => setTimeout(resolve, 100));
//         await emailQueue.resume();

//         console.log('▶️ Queue resumed (forced)');

//         // Get and inspect waiting jobs
//         const waitingJobs = await emailQueue.getWaiting();
//         console.log('📋 Waiting jobs details:');

//         for (let i = 0; i < Math.min(waitingJobs.length, 5); i++) {
//           const job = waitingJobs[i];
//           console.log(`   - Job ${job.id}:`, {
//             type: job.data.type,
//             email: job.data.data.email || job.data.data.MemberEmail || 'admin',
//             priority: job.opts.priority || 0,
//             delay: job.opts.delay || 0,
//             attempts: job.opts.attempts || 3,
//             created: new Date(job.timestamp).toISOString(),
//           });

//           // Try to manually trigger job processing
//           if (this.debugMode && i === 0) {
//             console.log(`🔧 Manually triggering job ${job.id}...`);
//             try {
//               // Force job to active state
//               await job.promote();
//               console.log(`⬆️ Job ${job.id} promoted`);
//             } catch (promoteError) {
//               console.log(
//                 `⚠️ Could not promote job ${job.id}:`,
//                 promoteError.message
//               );
//             }
//           }
//         }

//         // Wait a bit and check if processing started
//         await new Promise((resolve) => setTimeout(resolve, 2000));
//         const newStats = await this.getQueueStats();

//         if (newStats.active > 0) {
//           console.log('✅ Jobs are now being processed!');
//         } else if (newStats.waiting === stats.waiting) {
//           console.log(
//             '⚠️ Jobs still not processing - this indicates a deeper issue'
//           );
//           await this.debugQueueIssues();
//         }
//       } else {
//         console.log('✅ No waiting jobs found');
//       }
//     } catch (error) {
//       console.error('❌ Error force processing existing jobs:', error);
//     }
//   }

//   async debugQueueIssues() {
//     console.log('🔍 Debugging queue issues...');

//     try {
//       // Check if queue is paused
//       const isPaused = await emailQueue.isPaused();
//       console.log('⏸️ Queue paused:', isPaused);

//       if (isPaused) {
//         await emailQueue.resume();
//         console.log('▶️ Queue force resumed');
//       }

//       // Check Redis keys
//       if (this.debugMode) {
//         const keys = await new Promise((resolve, reject) => {
//           emailQueue.client.keys('bull:email:*', (err, result) => {
//             if (err) reject(err);
//             else resolve(result);
//           });
//         });
//         console.log('🔑 Redis keys count:', keys.length);
//         console.log('🔑 Key examples:', keys.slice(0, 5));
//       }

//       // Check queue settings
//       console.log('⚙️ Queue settings:', {
//         concurrency: emailConfig.queue.concurrency || 5,
//         defaultJobOptions: emailQueue.defaultJobOptions,
//       });
//     } catch (error) {
//       console.error('❌ Error debugging queue:', error);
//     }
//   }

//   async getQueueStats() {
//     const [waiting, active, completed, failed, delayed] = await Promise.all([
//       emailQueue.getWaiting(),
//       emailQueue.getActive(),
//       emailQueue.getCompleted(),
//       emailQueue.getFailed(),
//       emailQueue.getDelayed(),
//     ]);

//     return {
//       waiting: waiting.length,
//       active: active.length,
//       completed: completed.length,
//       failed: failed.length,
//       delayed: delayed.length,
//       total:
//         waiting.length +
//         active.length +
//         completed.length +
//         failed.length +
//         delayed.length,
//       timestamp: new Date().toISOString(),
//     };
//   }

//   startMonitoring() {
//     // Monitor queue every 15 seconds (more frequent for debugging)
//     setInterval(async () => {
//       try {
//         const stats = await this.getQueueStats();
//         console.log(`📊 [${stats.timestamp}] Queue Status:`, stats);

//         // If jobs are stuck in waiting, try multiple recovery strategies
//         if (stats.waiting > 0 && stats.active === 0) {
//           console.log(
//             '🔧 Jobs waiting but none active - attempting recovery...'
//           );

//           // Strategy 1: Resume queue
//           await emailQueue.resume();

//           // Strategy 2: Check if queue is paused
//           const isPaused = await emailQueue.isPaused();
//           if (isPaused) {
//             console.log('⚠️ Queue was paused - resuming...');
//             await emailQueue.resume();
//           }

//           // Strategy 3: Promote first waiting job
//           const waitingJobs = await emailQueue.getWaiting();
//           if (waitingJobs.length > 0) {
//             try {
//               await waitingJobs[0].promote();
//               console.log(`⬆️ Promoted job ${waitingJobs[0].id}`);
//             } catch (promoteError) {
//               console.log('⚠️ Could not promote job:', promoteError.message);
//             }
//           }
//         }
//       } catch (error) {
//         console.error('❌ Failed to get queue stats:', error);
//       }
//     }, 15000);
//   }

//   async gracefulShutdown() {
//     console.log('🔄 Shutting down email worker...');
//     try {
//       await emailQueue.pause();
//       console.log('⏸️ Queue paused');

//       // Wait for active jobs to complete (max 30 seconds)
//       const maxWaitTime = 30000;
//       const startTime = Date.now();

//       while (Date.now() - startTime < maxWaitTime) {
//         const active = await emailQueue.getActive();
//         if (active.length === 0) {
//           console.log('✅ All active jobs completed');
//           break;
//         }
//         console.log(
//           `⏳ Waiting for ${active.length} active jobs to complete...`
//         );
//         await new Promise((resolve) => setTimeout(resolve, 1000));
//       }

//       await emailQueue.close();
//       console.log('✅ Email worker shutdown complete');
//       process.exit(0);
//     } catch (error) {
//       console.error('❌ Error during shutdown:', error);
//       process.exit(1);
//     }
//   }
// }

// // Initialize and start the worker
// const worker = new EmailWorker();

// // Handle graceful shutdown
// process.on('SIGTERM', () => worker.gracefulShutdown());
// process.on('SIGINT', () => worker.gracefulShutdown());
// process.on('uncaughtException', (error) => {
//   console.error('💥 Uncaught Exception:', error);
//   worker.gracefulShutdown();
// });
// process.on('unhandledRejection', (reason, promise) => {
//   console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
// });

// // Start the worker
// worker.start().catch((error) => {
//   console.error('❌ Failed to start worker:', error);
//   process.exit(1);
// });

// module.exports = worker;
