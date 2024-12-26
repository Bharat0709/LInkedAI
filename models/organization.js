const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'An organization must have an email'],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      minlength: 8,
      select: false,
    },
    oauthProvider: {
      type: String,
      enum: ['google', 'github', 'none'],
      default: 'none',
    },
    oauthId: {
      type: String,
      default: null,
    },
    name: {
      type: String,
      default: 'Anonymous', // Default name if not provided
    },
    profilePicture: {
      type: String, // URL for the profile picture
      default: null, // Null if no profile picture is available
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
    plan: {
      type: String,
      enum: ['basic', 'pro', 'enterprise'],
      default: 'basic',
    },
    credits: {
      type: Number,
      default: 0,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Organization = mongoose.model('Organization', organizationSchema);

module.exports = Organization;
