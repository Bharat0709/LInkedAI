// AutomationHistory.js - Simplified MongoDB Schema
const mongoose = require('mongoose');
const { newDBConnection } = require('../config/db');

const AutomationHistorySchema = new mongoose.Schema(
  {
    // Core identification
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SavedPost',
      required: true,
    },
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },

    // Automation details
    automationType: {
      type: String,
      default: 'initial_outreach',
      enum: ['initial_outreach', 'follow_up_1', 'follow_up_2', 'follow_up_3', 'custom', 'linkedin_message'],
      required: true,
    },

    // Email/Message content
    emailContent: {
      to: { type: String, required: true },
      from: { type: String, required: true },
      subject: { type: String, required: true },
      body: { type: String, required: true },
      format: { type: String, enum: ['html', 'text'], default: 'text' },
      attachments: [
        {
          fileName: String,
          fileUrl: String,
          fileSize: Number,
          mimeType: String,
        },
      ],
    },

    // Template information
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmailTemplate',
    },
    templateName: { type: String, default: '' },

    // Approval workflow
    status: {
      type: String,
      enum: ['pending_approval', 'approved', 'rejected', 'sent', 'failed', 'scheduled'],
      default: 'pending_approval',
    },

    // Approval details
    approvalRequiredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
    },
    approvalDate: { type: Date },
    rejectionDate: { type: Date },
    rejectionReason: { type: String, default: '' },

    // Simple Scheduling
    scheduledFor: { type: Date },
    scheduledDate: { type: Date }, // When scheduling was set
    scheduledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
    },
    timeZone: { type: String, default: 'UTC' },
    sentAt: { type: Date },

    // Recurring Schedule
    isRecurring: { type: Boolean, default: false },
    recurringSchedule: {
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
      },
      interval: { type: Number, default: 1 }, // Every X days/weeks/months
      daysOfWeek: [{ type: Number, min: 0, max: 6 }], // 0=Sunday, 6=Saturday
      dayOfMonth: { type: Number, min: 1, max: 31 }, // For monthly
      endDate: { type: Date },
      maxOccurrences: { type: Number },
      currentOccurrence: { type: Number, default: 1 },
      nextScheduledDate: { type: Date },
    },

    // Multiple Scheduled Dates (for complex scheduling)
    scheduledDates: [
      {
        scheduledFor: { type: Date, required: true },
        status: {
          type: String,
          enum: ['pending', 'sent', 'failed', 'cancelled'],
          default: 'pending',
        },
        sentAt: { type: Date },
        notes: { type: String, default: '' },
      },
    ],

    // Delivery tracking
    deliveryStatus: {
      type: String,
      enum: ['pending', 'delivered', 'bounced', 'failed', 'opened', 'clicked'],
      default: 'pending',
    },

    // Response tracking
    responseReceived: { type: Boolean, default: false },
    responseDate: { type: Date },
    responseType: {
      type: String,
      enum: ['positive', 'negative', 'neutral', 'out_of_office'],
    },

    // Automation sequence
    sequenceNumber: { type: Number, default: 1 },
    isPartOfSequence: { type: Boolean, default: false },
    parentAutomationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AutomationHistory',
    },

    // Performance metrics
    openRate: { type: Number, default: 0 },
    clickRate: { type: Number, default: 0 },
    replyRate: { type: Number, default: 0 },

    // Error handling
    errorMessage: { type: String, default: '' },
    retryCount: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },

    // Additional metadata
    campaignId: { type: String, default: '' },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },

    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
AutomationHistorySchema.index({ memberId: 1, createdAt: -1 });
AutomationHistorySchema.index({ organizationId: 1, createdAt: -1 });
AutomationHistorySchema.index({ postId: 1, createdAt: -1 });
AutomationHistorySchema.index({ status: 1, scheduledFor: 1 });
AutomationHistorySchema.index({ automationType: 1 });
AutomationHistorySchema.index({ deliveryStatus: 1 });
AutomationHistorySchema.index({ approvalRequiredBy: 1, status: 1 });
AutomationHistorySchema.index({ isRecurring: 1, 'recurringSchedule.nextScheduledDate': 1 });
AutomationHistorySchema.index({ 'scheduledDates.scheduledFor': 1, 'scheduledDates.status': 1 });

// Virtual for calculating time since creation
AutomationHistorySchema.virtual('ageInHours').get(function () {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60));
});

// Virtual to check if approval is overdue
AutomationHistorySchema.virtual('isApprovalOverdue').get(function () {
  if (this.status !== 'pending_approval') return false;
  const hoursOld = this.ageInHours;
  return hoursOld > 24; // Consider overdue after 24 hours
});

// Virtual to check if scheduled automation is due
AutomationHistorySchema.virtual('isScheduleDue').get(function () {
  if (this.status !== 'scheduled' || !this.scheduledFor) return false;
  return new Date() >= this.scheduledFor;
});

// Virtual to get next scheduled date
AutomationHistorySchema.virtual('nextScheduleDate').get(function () {
  if (this.isRecurring && this.recurringSchedule?.nextScheduledDate) {
    return this.recurringSchedule.nextScheduledDate;
  }

  if (this.scheduledDates?.length > 0) {
    const pendingDates = this.scheduledDates.filter(sd => sd.status === 'pending').sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor));
    return pendingDates[0]?.scheduledFor || null;
  }

  return this.scheduledFor;
});

// Method to approve automation
AutomationHistorySchema.methods.approve = function (approvedBy) {
  this.status = 'approved';
  this.approvedBy = approvedBy;
  this.approvalDate = new Date();
  this.updatedAt = new Date();
};

// Method to reject automation
AutomationHistorySchema.methods.reject = function (rejectedBy, reason = '') {
  this.status = 'rejected';
  this.rejectedBy = rejectedBy;
  this.rejectionDate = new Date();
  this.rejectionReason = reason;
  this.updatedAt = new Date();
};

// Method to mark as sent
AutomationHistorySchema.methods.markAsSent = function () {
  this.status = 'sent';
  this.sentAt = new Date();
  this.updatedAt = new Date();
};

// Method to schedule for specific date and time
AutomationHistorySchema.methods.scheduleFor = function (dateTime, timeZone = 'UTC', scheduledBy) {
  this.scheduledFor = new Date(dateTime);
  this.scheduledDate = new Date();
  this.scheduledBy = scheduledBy;
  this.timeZone = timeZone;
  this.status = 'scheduled';
  this.updatedAt = new Date();
};

// Method to add multiple scheduled dates
AutomationHistorySchema.methods.addScheduledDates = function (dates) {
  if (!this.scheduledDates) this.scheduledDates = [];

  dates.forEach(date => {
    this.scheduledDates.push({
      scheduledFor: new Date(date.scheduledFor),
      notes: date.notes || '',
    });
  });

  this.updatedAt = new Date();
};

// Method to set up recurring schedule
AutomationHistorySchema.methods.setupRecurring = function (recurringConfig) {
  this.isRecurring = true;
  this.recurringSchedule = {
    frequency: recurringConfig.frequency,
    interval: recurringConfig.interval || 1,
    daysOfWeek: recurringConfig.daysOfWeek || [],
    dayOfMonth: recurringConfig.dayOfMonth,
    endDate: recurringConfig.endDate ? new Date(recurringConfig.endDate) : null,
    maxOccurrences: recurringConfig.maxOccurrences,
    currentOccurrence: 1,
    nextScheduledDate: this.calculateNextRecurringDate(),
  };

  this.status = 'scheduled';
  this.updatedAt = new Date();
};

// Method to calculate next recurring date
AutomationHistorySchema.methods.calculateNextRecurringDate = function () {
  if (!this.isRecurring || !this.recurringSchedule) return null;

  const { frequency, interval, daysOfWeek, dayOfMonth } = this.recurringSchedule;
  const baseDate = this.sentAt || this.scheduledFor || new Date();
  const nextDate = new Date(baseDate);

  switch (frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + interval);
      break;

    case 'weekly':
      if (daysOfWeek && daysOfWeek.length > 0) {
        // Find next occurrence for specified days of week
        let daysToAdd = 1;
        let currentDay = nextDate.getDay();

        while (daysToAdd <= 7 * interval) {
          const checkDay = (currentDay + daysToAdd) % 7;
          if (daysOfWeek.includes(checkDay)) {
            nextDate.setDate(nextDate.getDate() + daysToAdd);
            break;
          }
          daysToAdd++;
        }
      } else {
        nextDate.setDate(nextDate.getDate() + 7 * interval);
      }
      break;

    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + interval);
      if (dayOfMonth && dayOfMonth >= 1 && dayOfMonth <= 31) {
        nextDate.setDate(dayOfMonth);
      }
      break;
  }

  return nextDate;
};

// Method to update recurring schedule
AutomationHistorySchema.methods.updateRecurringSchedule = function () {
  if (!this.isRecurring || !this.recurringSchedule) return;

  const recurringConfig = this.recurringSchedule;

  // Check if we should continue recurring
  if (recurringConfig.maxOccurrences && recurringConfig.currentOccurrence >= recurringConfig.maxOccurrences) {
    this.isRecurring = false;
    return;
  }

  if (recurringConfig.endDate && new Date() > recurringConfig.endDate) {
    this.isRecurring = false;
    return;
  }

  // Calculate next occurrence
  recurringConfig.currentOccurrence += 1;
  recurringConfig.nextScheduledDate = this.calculateNextRecurringDate();

  this.updatedAt = new Date();
};

// Method to mark scheduled date as sent
AutomationHistorySchema.methods.markScheduledDateSent = function (scheduledDate) {
  if (!this.scheduledDates) return false;

  const dateEntry = this.scheduledDates.find(sd => sd.scheduledFor.getTime() === new Date(scheduledDate).getTime());

  if (dateEntry) {
    dateEntry.status = 'sent';
    dateEntry.sentAt = new Date();
    this.updatedAt = new Date();
    return true;
  }

  return false;
};

// Method to cancel specific scheduled date
AutomationHistorySchema.methods.cancelScheduledDate = function (scheduledDate, reason = '') {
  if (!this.scheduledDates) return false;

  const dateEntry = this.scheduledDates.find(sd => sd.scheduledFor.getTime() === new Date(scheduledDate).getTime());

  if (dateEntry && dateEntry.status === 'pending') {
    dateEntry.status = 'cancelled';
    dateEntry.notes = reason;
    this.updatedAt = new Date();
    return true;
  }

  return false;
};

// Method to track delivery
AutomationHistorySchema.methods.updateDeliveryStatus = function (status) {
  this.deliveryStatus = status;
  this.updatedAt = new Date();
};

// Middleware to update the 'updatedAt' field on save
AutomationHistorySchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const AutomationHistory = newDBConnection.model('AutomationHistory', AutomationHistorySchema);

module.exports = AutomationHistory;
