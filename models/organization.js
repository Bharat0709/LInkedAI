const mongoose = require('mongoose');
const crypto = require('crypto');

const organizationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'An organization must have an email'],
      unique: true,
      lowercase: true,
    },
    credits: {
      type: Number,
      default: 100,
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
      enum: ['google', 'github', 'password'],
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
      default: null,
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
      default: true,
    },
    subscription: {
      plan: {
        type: String,
        enum: ['basic', 'pro', 'enterprise'],
        default: 'basic',
      },
      status: {
        type: String,
        enum: ['active', 'inactive', 'canceled'],
        default: 'active',
      },
      renewalDate: {
        type: Date,
        default: null,
      },
    },
    activityLog: [
      {
        action: { type: String },
        timestamp: { type: Date, default: Date.now },
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
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

organizationSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

organizationSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // Token valid for 10 minutes
  return resetToken;
};

const Organization = mongoose.model('Organization', organizationSchema);

module.exports = Organization;
