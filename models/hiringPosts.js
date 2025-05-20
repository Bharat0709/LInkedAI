const mongoose = require('mongoose');
const { newDBConnection } = require('../db');

const HiringPostSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Post content is required'],
  },
  emailAddresses: {
    type: [String],
    default: [],
  },
  formLinks: {
    type: [String],
    default: [],
  },
  
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
  
  // Organization context
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['new', 'contacted', 'responded', 'closed', 'rejected'],
    default: 'new',
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
  
  // Optional notes
  notes: {
    type: String,
    default: '',
  },
  
  // To track if the post is still active on LinkedIn
  isActive: {
    type: Boolean,
    default: true,
  },
  
  // Source platform (for future expansion)
  source: {
    type: String,
    default: 'linkedin',
    enum: ['linkedin', 'twitter', 'facebook', 'other'],
  },
  
  // Type of hiring post
  postType: {
    type: String,
    default: 'hiring',
  },
  
  // For storing a categorized job role if detected
  jobRole: {
    type: String,
    default: '',
  },
  
  // Potential candidate fields
  candidateRequirements: {
    type: [String],
    default: [],
  },
  
  // Save original post URL if available
  postUrl: {
    type: String,
    default: '',
  }
});

// Add index for faster queries
HiringPostSchema.index({ createdAt: -1 });
HiringPostSchema.index({ organizationId: 1, createdAt: -1 });
HiringPostSchema.index({ savedBy: 1, createdAt: -1 });
HiringPostSchema.index({ status: 1 });

// Middleware to update the 'updatedAt' field on save
HiringPostSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for calculating how long the post has been active
HiringPostSchema.virtual('activeTime').get(function() {
  return (Date.now() - this.createdAt) / (1000 * 60 * 60 * 24); // Days
});

const HiringPost = newDBConnection.model('HiringPost', HiringPostSchema);

module.exports = HiringPost;