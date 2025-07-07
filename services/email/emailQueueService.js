// ===== 5. SERVICES/EMAIL-QUEUE-SERVICE.JS - Enhanced Queue Service =====
const emailQueue = require('../../queues/emailQueue');
const EmailValidator = require('../../utils/mailUtils/emailValidator');
const emailConfig = require('../../config/emailConfig');

class EmailQueueService {
  // Enhanced add to queue method with validation
  static async addToQueue(type, data, options = {}) {
    try {
      // Input validation
      if (!type || typeof type !== 'string') {
        throw new Error('Email type is required and must be a string');
      }

      if (!data || typeof data !== 'object') {
        throw new Error('Email data is required and must be an object');
      }

      // Sanitize data
      const sanitizedData = EmailValidator.sanitizeEmailData(data);

      // Validate based on email type
      const validation = this.validateEmailType(type, sanitizedData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      console.log(
        `📥 [${new Date().toISOString()}] Adding email to queue: ${type}`,
        {
          email: sanitizedData.email || sanitizedData.MemberEmail || 'admin',
          priority: options.priority || 0,
        }
      );

      const jobOptions = {
        priority: options.priority || 0,
        delay: options.delay || 0,
        attempts: options.attempts || emailConfig.queue.attempts,
        ...options,
      };

      const job = await emailQueue.add(
        'send-email',
        {
          type,
          data: sanitizedData,
          timestamp: new Date().toISOString(),
          queuedBy: options.queuedBy || 'system',
        },
        jobOptions
      );

      console.log(
        `📬 [${new Date().toISOString()}] Email queued successfully:`,
        {
          type,
          jobId: job.id,
          priority: jobOptions.priority,
          email: sanitizedData.email || sanitizedData.MemberEmail || 'admin',
        }
      );

      return job;
    } catch (error) {
      console.error(`❌ [${new Date().toISOString()}] Failed to queue email:`, {
        type,
        error: error.message,
        data: data ? Object.keys(data) : 'null',
      });
      throw error;
    }
  }

  // Validation for different email types
  static validateEmailType(type, data) {
    const validationRules = {
      NEW_MEMBER_INVITE: [
        'OrganizationName',
        'MemberName',
        'MemberEmail',
        'ConnectionToken',
      ],
      POST_STATUS: ['email', 'post', 'status'],
      EXTENSION_CONNECTED: ['user'],
      ONBOARDING_COMPLETE: ['user'],
      MILESTONE: ['user'],
      RESET_PASSWORD: ['email', 'subject', 'resetURL'],
      PASSWORD_CHANGED: ['user'],
      WELCOME: ['email', 'name'],
      SURVEY_FEEDBACK: [
        'usability',
        'performance',
        'email',
        'overallSatisfaction',
      ],
      NEW_USER_NOTIFICATION: ['user'],
      HELP_REQUEST: ['user', 'helpMessage'],
      USER_FEEDBACK: ['user', 'rating', 'feedbackText'],
    };

    const requiredFields = validationRules[type] || [];
    return EmailValidator.validateEmailData(data, requiredFields);
  }

  // Member email methods with enhanced validation
  static async queueNewMemberInvite(
    OrganizationName,
    MemberName,
    MemberEmail,
    ConnectionToken,
    options = {}
  ) {
    return this.addToQueue(
      'NEW_MEMBER_INVITE',
      { OrganizationName, MemberName, MemberEmail, ConnectionToken },
      { priority: emailConfig.priorities.MEDIUM, ...options }
    );
  }

  static async queuePostStatus(
    email,
    post,
    status,
    errorMessage = '',
    options = {}
  ) {
    return this.addToQueue(
      'POST_STATUS',
      { email, post, status, errorMessage },
      { priority: emailConfig.priorities.LOW, ...options }
    );
  }

  static async queueExtensionConnected(user, options = {}) {
    return this.addToQueue(
      'EXTENSION_CONNECTED',
      { user },
      { priority: emailConfig.priorities.MEDIUM, ...options }
    );
  }

  static async queueOnboardingComplete(user, options = {}) {
    return this.addToQueue(
      'ONBOARDING_COMPLETE',
      { user },
      { priority: emailConfig.priorities.LOW, ...options }
    );
  }

  static async queueMilestone(user, options = {}) {
    return this.addToQueue(
      'MILESTONE',
      { user },
      { priority: emailConfig.priorities.BACKGROUND, ...options }
    );
  }

  // Organization email methods
  static async queueResetPassword(email, subject, resetURL, options = {}) {
    return this.addToQueue(
      'RESET_PASSWORD',
      { email, subject, resetURL },
      { priority: emailConfig.priorities.CRITICAL, ...options }
    );
  }

  static async queuePasswordChanged(user, options = {}) {
    return this.addToQueue(
      'PASSWORD_CHANGED',
      { user },
      { priority: emailConfig.priorities.HIGH, ...options }
    );
  }

  static async queueWelcome(email, name, options = {}) {
    return this.addToQueue(
      'WELCOME',
      { email, name },
      { priority: emailConfig.priorities.LOW, ...options }
    );
  }

  // Admin email methods
  static async queueSurveyFeedback(
    usability,
    performance,
    missingFeatures,
    reason,
    email,
    overallSatisfaction,
    options = {}
  ) {
    return this.addToQueue(
      'SURVEY_FEEDBACK',
      {
        usability,
        performance,
        missingFeatures,
        reason,
        email,
        overallSatisfaction,
      },
      { priority: emailConfig.priorities.MEDIUM, ...options }
    );
  }

  static async queueNewUserNotification(user, options = {}) {
    return this.addToQueue(
      'NEW_USER_NOTIFICATION',
      { user },
      { priority: emailConfig.priorities.HIGH, ...options }
    );
  }

  static async queueHelpRequest(user, helpMessage, options = {}) {
    return this.addToQueue(
      'HELP_REQUEST',
      { user, helpMessage },
      { priority: emailConfig.priorities.HIGH, ...options }
    );
  }

  static async queueUserFeedback(user, rating, feedbackText, options = {}) {
    console.log(
      `📩 [${new Date().toISOString()}] Queueing feedback email for user:`,
      {
        userName: user?.name || 'unknown user',
        rating,
      }
    );
    return this.addToQueue(
      'USER_FEEDBACK',
      { user, rating, feedbackText },
      { priority: emailConfig.priorities.LOW, ...options }
    );
  }

  // Enhanced utility methods
  static async getQueueStats() {
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        emailQueue.getWaiting(),
        emailQueue.getActive(),
        emailQueue.getCompleted(),
        emailQueue.getFailed(),
        emailQueue.getDelayed(),
      ]);

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        total:
          waiting.length +
          active.length +
          completed.length +
          failed.length +
          delayed.length,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Failed to get queue stats:', error);
      throw error;
    }
  }

  static async getJobsByType(type, state = 'waiting') {
    try {
      let jobs;
      switch (state) {
        case 'waiting':
          jobs = await emailQueue.getWaiting();
          break;
        case 'active':
          jobs = await emailQueue.getActive();
          break;
        case 'completed':
          jobs = await emailQueue.getCompleted();
          break;
        case 'failed':
          jobs = await emailQueue.getFailed();
          break;
        default:
          throw new Error(`Invalid state: ${state}`);
      }

      return jobs.filter((job) => job.data.type === type);
    } catch (error) {
      console.error(`❌ Failed to get ${state} jobs for type ${type}:`, error);
      throw error;
    }
  }

  static async cleanQueue() {
    try {
      console.log('🧹 Starting queue cleanup...');

      const cleanCompleted = await emailQueue.clean(
        emailConfig.cleanup.completedJobTTL,
        'completed'
      );
      const cleanFailed = await emailQueue.clean(
        emailConfig.cleanup.failedJobTTL,
        'failed'
      );

      console.log(`✅ Queue cleanup completed:`, {
        cleanedCompleted: cleanCompleted.length,
        cleanedFailed: cleanFailed.length,
        timestamp: new Date().toISOString(),
      });

      return {
        cleanedCompleted: cleanCompleted.length,
        cleanedFailed: cleanFailed.length,
      };
    } catch (error) {
      console.error('❌ Failed to clean queue:', error);
      throw error;
    }
  }

  static async pauseQueue() {
    await emailQueue.pause();
    console.log('⏸️ Email queue paused');
  }

  static async resumeQueue() {
    await emailQueue.resume();
    console.log('▶️ Email queue resumed');
  }

  static async getFailedJobs(limit = 10) {
    try {
      const failed = await emailQueue.getFailed(0, limit - 1);
      return failed.map((job) => ({
        id: job.id,
        type: job.data.type,
        email: job.data.data.email || job.data.data.MemberEmail || 'admin',
        error: job.failedReason,
        attempts: job.attemptsMade,
        timestamp: job.timestamp,
        processedOn: job.processedOn,
      }));
    } catch (error) {
      console.error('❌ Failed to get failed jobs:', error);
      throw error;
    }
  }
}

module.exports = EmailQueueService;
