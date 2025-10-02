const mongoose = require('mongoose');
const { newDBConnection } = require('../config/db');

const SavedPostSchema = new mongoose.Schema({
  // Core content
  content: {
    type: String,
    required: [true, 'Post content is required'],
  },
  title: {
    type: String,
    default: '',
  },
  // Contact information
  emailAddresses: {
    type: [String],
    default: [],
  },
  formLinks: {
    type: [String],
    default: [],
  },

  // Author information
  author: {
    type: String,
    required: [true, 'Author name is required'],
  },
  authorUrl: {
    type: String,
    default: '',
  },
  // Engagement metrics
  likes: {
    type: Number,
    default: 0,
  },
  comments: {
    type: Number,
    default: 0,
  },

  savedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true,
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },

  leadStatus: {
    type: String,
    enum: ['new', 'contacted', 'responded', 'qualified', 'converted', 'closed', 'rejected'],
    default: 'new',
  },
  leadPriority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },

  generatedEmailBody: {
    type: String,
    default: '',
  },
  generatedSubject: {
    type: String,
    default: '',
  },
  generatedLinkedInMessage: {
    type: String,
    default: '',
  },
  // Automation settings
  automationEnabled: {
    type: String,
    enum: ['none', 'semi', 'full'],
    default: 'none',
  },
  generateEmail: {
    type: Boolean,
    default: false,
  },
  generateLinkedInMessage: {
    type: Boolean,
    default: false,
  },
  autoFollowUp: {
    type: Boolean,
    default: false,
  },
  followUpInterval: {
    type: Number,
    default: 7,
  },
  maxFollowUps: {
    type: Number,
    default: 3,
  },
  followUpCount: {
    type: Number,
    default: 0,
  },
  category: {
    type: String,
    default: 'general',
  },
  tags: {
    type: [String],
    default: [],
  },
  industry: {
    type: String,
    default: '',
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  lastContactedAt: {
    type: Date,
  },
  notes: {
    type: String,
    default: '',
  },
  followUpDate: {
    type: Date,
  },
  nextAutomationDate: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  companySize: {
    type: String,
    enum: ['startup', 'small', 'medium', 'large', 'enterprise'],
  },
  budget: {
    type: String,
    default: '',
  },
  campaignId: {
    type: String,
    default: '',
  },
  automationHistory: [
    {
      action: {
        type: String,
        enum: ['email_sent', 'linkedin_message_sent', 'follow_up_scheduled', 'automation_paused', 'automation_resumed'],
      },
      metaData: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: ['success', 'failed', 'pending'],
        default: 'pending',
      },
      details: {
        type: String,
        default: '',
      },
    },
  ],
  emailTemplate: {
    type: String,
    default: '',
  },
  linkedInTemplate: {
    type: String,
    default: '',
  },
  personalizationLevel: {
    type: String,
    enum: ['basic', 'medium', 'high'],
    default: 'medium',
  },
});

// Indexes for better performance
SavedPostSchema.index({ createdAt: -1 });
SavedPostSchema.index({ organizationId: 1, createdAt: -1 });
SavedPostSchema.index({ savedBy: 1, createdAt: -1 });
SavedPostSchema.index({ leadStatus: 1 });
SavedPostSchema.index({ category: 1 });
SavedPostSchema.index({ tags: 1 });
SavedPostSchema.index({ followUpDate: 1 });
SavedPostSchema.index({ nextAutomationDate: 1 });
SavedPostSchema.index({ automationEnabled: 1 });
SavedPostSchema.index({ generateEmail: 1 });
SavedPostSchema.index({ generateLinkedInMessage: 1 });

// Middleware to update the 'updatedAt' field on save
SavedPostSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for calculating lead age
SavedPostSchema.virtual('leadAge').get(function () {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24)); // Days
});

// Virtual to check if automation is due
SavedPostSchema.virtual('isAutomationDue').get(function () {
  if (this.automationEnabled === 'none' || !this.nextAutomationDate) {
    return false;
  }
  return new Date() >= this.nextAutomationDate;
});

// Virtual to get automation status
SavedPostSchema.virtual('automationStatus').get(function () {
  if (this.automationEnabled === 'none') return 'disabled';
  if (this.followUpCount >= this.maxFollowUps) return 'completed';
  if (this.isAutomationDue) return 'due';
  return 'scheduled';
});

// Method to schedule next automation
SavedPostSchema.methods.scheduleNextAutomation = function () {
  if (this.automationEnabled !== 'none' && this.followUpCount < this.maxFollowUps) {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + this.followUpInterval);
    this.nextAutomationDate = nextDate;
  }
};

// Method to add automation history
SavedPostSchema.methods.addAutomationHistory = function (action, status, details = '') {
  this.automationHistory.push({
    action,
    status,
    details,
    timestamp: new Date(),
  });

  // Keep only last 50 entries to prevent document size issues
  if (this.automationHistory.length > 50) {
    this.automationHistory = this.automationHistory.slice(-50);
  }
};

const SavedPost = newDBConnection.model('SavedPost', SavedPostSchema);

module.exports = SavedPost;
