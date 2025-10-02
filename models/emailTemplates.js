const mongoose = require('mongoose');
const { newDBConnection } = require('../config/db');

const EmailTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Template name is required'],
    trim: true,
    maxlength: [100, 'Template name cannot exceed 100 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [300, 'Description cannot exceed 300 characters'],
    default: '',
  },
  subject: {
    type: String,
    required: [true, 'Email subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters'],
  },
  templateBody: {
    type: String,
    required: [true, 'Template body is required'],
  },
  templateType: {
    type: String,
    enum: ['html', 'text'],
    default: 'html',
  },
  category: {
    type: String,
    enum: ['outreach', 'follow_up', 'introduction', 'networking', 'cold_email', 'meeting_request', 'thank_you', 'proposal', 'custom'],
    default: 'custom',
  },
  placeholders: {
    type: [String],
    default: [],
    validate: {
      validator: function (v) {
        return v.length <= 20;
      },
      message: 'Cannot have more than 20 placeholders',
    },
  },
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true,
    index: true,
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

EmailTemplateSchema.index({ memberId: 1, createdAt: -1 });
EmailTemplateSchema.index({ organizationId: 1, createdAt: -1 });
EmailTemplateSchema.index({ category: 1 });
EmailTemplateSchema.index({ isActive: 1 });

// Update timestamp on save
EmailTemplateSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const EmailTemplate = newDBConnection.model('EmailTemplate', EmailTemplateSchema);

module.exports = EmailTemplate;
