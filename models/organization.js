const mongoose = require('mongoose');
const { newDBConnection } = require('../db');
const crypto = require('crypto');

const organizationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'An organization must have an email'],
      unique: true,
      lowercase: true,
    },
    timeZone: {
      type: String,
      default: 'Asia/Calcutta',
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    totalCreditsUsed: {
      type: Number,
      default: 0,
    },
    password: {
      type: String,
      minlength: 8,
      select: false,
    },
    oauthProvider: {
      type: String,
      enum: ['google', 'password'],
      default: 'password',
    },
    oauthId: {
      type: String,
      default: null,
    },
    name: {
      type: String,
      default: 'EngageGPT User',
    },
    profilePicture: {
      type: String,
      default: 'https://firebasestorage.googleapis.com/v0/b/coldemail-2d11a.appspot.com/o/Avatar.png?alt=media&token=b07b4ca9-074c-465e-985b-7c6e562f2e7b',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    billingDetails: {
      addressLine1: { type: String },
      addressLine2: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
      postalCode: { type: String },
      phoneNumber: { type: String },
    },
    invoices: [
      {
        invoiceURL: {
          type: String,
        },
        generatedOn: {
          type: Date,
        },
      },
    ],
    subscription: {
      plan: {
        type: String,
        enum: ['trial', 'pro', 'enterprise'],
        default: 'trial',
      },
      status: {
        type: String,
        enum: ['active', 'inactive', 'canceled', 'trial', 'expired'],
        default: 'trial',
      },
      renewalDate: {
        type: Date,
        default: null,
      },
      trialStartDate: {
        type: Date,
        default: Date.now,
      },
      trialEndDate: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      canceledAt: {
        type: Date,
        default: null,
      },
      purchasedOn: {
        type: Date,
        default: null,
      },
      isFirstPurchase: {
        type: Boolean,
        default: false,
      },
    },
    planUsage: {
      maxMembers: {
        type: Number,
        default: 1,
      },
      currentMemberCount: {
        type: Number,
        default: 0,
      },
      monthlyUsage: {
        monthStartDate: {
          type: Date,
          default: Date.now,
        },
        monthEndDate: {
          type: Date,
          default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        postsSaved: {
          type: Number,
          default: 0,
        },
        maxPostsSavedPerMonth: {
          type: Number,
          default: 50,
        },
        postsScheduled: {
          type: Number,
          default: 0,
        },
        maxPostsScheduledPerMonth: {
          type: Number,
          default: 10,
        },
        contentCalendarDaysAdded: {
          type: Number,
          default: 0,
        },
        maxContentCalendarDays: {
          type: Number,
          default: 30,
        },
        emailsSent: {
          type: Number,
          default: 0,
        },
        maxEmailsPerMonth: {
          type: Number,
          default: 0,
        },
      },
      dailyUsage: {
        date: {
          type: String,
          default: () => new Date().toISOString().substring(0, 10),
        },
        aiCreditsUsedToday: {
          viralPostGenerator: {
            type: Number,
            default: 0,
          },
          maxPostGeneratorCreditsperDay: {
            type: Number,
            default: 100,
          },
          maxextensionCreditsperDay: {
            type: Number,
            default: 50,
          },
        },
      },
    },
    planFeatures: {
      aiModels: {
        type: [String],
        enum: ['gemini', 'chatgpt', 'mistral', 'groq'],
        default: ['gemini', 'chatgpt'],
      },
      hasPrioritySupport: {
        type: Boolean,
        default: false,
      },
      canBuyCredits: {
        type: Boolean,
        default: true,
      },
    },
    security: {
      twoFactorEnabled: { type: Boolean, default: false },
      lastLoginAt: { type: Date },
      failedLoginAttempts: { type: Number, default: 0 },
    },
    activityLog: [
      {
        action: { type: String },
        timestamp: { type: Date, default: Date.now },
        metadata: { type: mongoose.Schema.Types.Mixed },
      },
    ],
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);
organizationSchema.index({ email: 1 });
organizationSchema.index({ emailVerificationToken: 1 });
organizationSchema.index({ passwordResetToken: 1 });

organizationSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

organizationSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const Organization = newDBConnection.model('Organization', organizationSchema);

module.exports = Organization;
