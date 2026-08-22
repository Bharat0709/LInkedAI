const mongoose = require('mongoose');
const { newDBConnection } = require('../config/db');
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
    credits: {
      balance: {
        type: Number,
        default: 200,
      },
      totalUsed: {
        type: Number,
        default: 0,
      },
      expiresAt: {
        type: Date,
        default: function () {
          return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        },
      },
      transactions: [
        {
          type: { type: String, enum: ['purchase', 'usage', 'adjustment', 'refund', 'bonus', 'expiry'] },
          amount: { type: Number, required: true },
          balance: { type: Number }, // Balance after transaction
          description: { type: String },
          metadata: {
            featureUsed: String,
            campaignId: String,
            // Any additional context
          },
          expiresAt: { type: Date },
          createdAt: { type: Date, default: Date.now },
        },
      ],
    },
    payments: [
      {
        paymentId: { type: String },
        amount: { type: Number },
        currency: { type: String, default: 'INR' },
        status: {
          type: String,
          enum: ['pending', 'succeeded', 'failed', 'refunded'],
          default: 'pending',
        },
        paymentMethod: { type: String },
        creditsAdded: { type: Number },
        invoiceId: { type: String },
        processedAt: { type: Date },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    referral: {
      referralCode: {
        type: String,
        unique: true,
        sparse: true,
      },
      referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
      },
      referralCreditsEarned: { type: Number, default: 0 },
      referralCount: { type: Number, default: 0 },
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
    planFeatures: {
      aiModels: {
        type: [String],
        enum: ['chatgpt', 'mistral', 'groq', 'perplexity'],
        default: ['chatgpt', 'groq'],
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
organizationSchema.index({ 'credits.expiresAt': 1 });

organizationSchema.methods.areCreditsExpired = function () {
  return this.credits.expiresAt && this.credits.expiresAt < new Date();
};

organizationSchema.methods.expireCredits = async function () {
  if (this.areCreditsExpired() && this.credits.balance > 0) {
    const expiredAmount = this.credits.balance;

    this.credits.transactions.push({
      type: 'expiry',
      amount: -expiredAmount,
      balance: 0,
      description: `Credits expired on ${this.credits.expiresAt.toDateString()}`,
      createdAt: new Date(),
    });

    this.credits.balance = 0;
    await this.save();

    return expiredAmount;
  }
  return 0;
};

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
