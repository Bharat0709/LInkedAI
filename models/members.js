const mongoose = require('mongoose');
const { newDBConnection } = require('../config/db');
const validator = require('validator');

const MemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please Provide Your Name'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  email: {
    type: String,
    validate: [validator.isEmail, 'Please Provide a Valid Email'],
    unique: true,
    required: [true, 'Please Provide an Email'],
    lowercase: true,
    trim: true,
  },
  timeZone: {
    type: String,
    default: 'Asia/Calcutta',
  },
  profileLink: {
    type: String,
    default: '',
    validate: {
      validator: function (v) {
        return !v || validator.isURL(v);
      },
      message: 'Please provide a valid URL',
    },
  },
  profilePicture: {
    type: String,
    default: 'https://firebasestorage.googleapis.com/v0/b/coldemail-2d11a.appspot.com/o/Avatar.png?alt=media&token=b07b4ca9-074c-465e-985b-7c6e562f2e7b',
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  creditsUsedToday: {
    type: Number,
    default: 0,
  },
  creditLimitperDay: {
    type: Number,
    default: 100,
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true,
  },
  role: {
    type: String,
    enum: ['member', 'profile', 'self', 'admin', 'owner'],
    default: 'profile',
  },
  leaderBoardProfileVisibility: {
    type: Boolean,
    default: true,
  },
  daysActive: {
    type: Number,
    default: 0,
  },
  accountCreatedAt: {
    type: Date,
    default: Date.now(),
  },
  totalCreditsUsed: {
    type: Number,
    default: 0,
  },
  lastActive: {
    type: Date,
    default: Date.now(),
  },
  connectionToken: {
    type: String,
    unique: true,
    default: '',
  },
  isConnected: {
    type: String,
    default: 'invited',
    enum: ['invited', 'connected', 'disconnected'],
  },
  followersCount: {
    type: Number,
    default: 0,
  },
  followingCount: {
    type: Number,
    default: 0,
  },
  connectionsCount: {
    type: Number,
    default: 0,
  },
  profileViews: {
    type: Number,
    default: 0,
  },
  searchAppearances: {
    type: Number,
    default: 0,
  },
  completedProfileAspects: {
    type: [String],
    default: [],
  },
  missingProfileAspects: {
    type: [String],
    default: [],
  },
  lastSyncedAt: {
    type: String,
    default: '',
  },
  linkedinAccessToken: {
    type: String,
    select: false,
  },
  writingPersona: {
    type: String,
    default: '',
  },
  isLinkedinConnected: {
    type: Boolean,
    default: false,
  },
  tokenExpiresIn: {
    type: Date,
  },
  linkedinProfileId: {
    type: String,
  },
  emailProvider: {
    type: String,
    enum: ['gmail', 'outlook', 'yahoo', 'custom', ''],
    default: '',
  },
  aiModels: {
    type: [String],
    enum: ['gemini', 'chatgpt', 'mistral', 'groq', 'perplexity'],
    default: ['gemini', 'chatgpt', 'groq', 'perplexity'],
  },
  hasCustomAIComments: {
    type: Boolean,
    default: false,
  },
  postSavingPreferences: {
    enabled: {
      type: Boolean,
      default: true,
    },
    enableCustomKeywords: {
      type: Boolean,
      default: true,
    },
    keywords: {
      type: [String],
      default: [],
      validate: {
        validator: function (v) {
          return v.length <= 50;
        },
        message: 'Cannot have more than 50 keywords',
      },
    },
    excludeKeywords: {
      type: [String],
      default: [],
      validate: {
        validator: function (v) {
          return v.length <= 50;
        },
        message: 'Cannot have more than 50 exclude keywords',
      },
    },
    saveAllPosts: {
      type: Boolean,
      default: false,
    },
    maxPostsPerDay: {
      type: Number,
      default: 100,
      min: 1,
      max: 1000,
    },
    minCharCount: {
      type: Number,
      default: 50,
    },
    postTypes: {
      type: [String],
      enum: ['text', 'image', 'video', 'document', 'link', 'poll', 'all'],
      default: ['all'],
    },
    autoTagPosts: {
      type: Boolean,
      default: false,
    },
    customCategories: {
      type: [
        {
          name: String,
          keywords: [String],
          color: {
            type: String,
            default: '#3498db',
          },
        },
      ],
      default: [],
    },
    autoDetectEmailAddresses: {
      type: Boolean,
      default: true,
    },
    autoDetectFormLinks: {
      type: Boolean,
      default: true,
    },
    saveFrequency: {
      type: String,
      enum: ['realtime', 'hourly', 'daily'],
      default: 'realtime',
    },
  },
  feedFilterSettings: {
    enabled: {
      type: Boolean,
      default: true,
    },
    hideKeywords: {
      type: [String],
      default: [],
      validate: {
        validator: function (v) {
          return v.length <= 100;
        },
        message: 'Cannot have more than 100 hide keywords',
      },
    },
  },
  summary: {
    professionalProfile: {
      currentRole: {
        type: String,
        default: '',
        maxlength: [100, 'Current role cannot exceed 100 characters'],
      },
      profileDescription: {
        type: String,
        default: '',
        maxlength: [500, 'Profile description cannot exceed 500 characters'],
      },
      experienceLevel: {
        type: String,
        enum: ['entry', 'junior', 'mid', 'senior', 'executive', 'student', 'fresher'],
        default: 'entry',
      },
      industry: {
        type: String,
        default: '',
        maxlength: [100, 'Industry cannot exceed 100 characters'],
      },
      functionalArea: {
        type: [String],
        default: [],
        validate: {
          validator: function (v) {
            return v.length <= 10;
          },
          message: 'Cannot have more than 10 functional areas',
        },
      },
      companySize: {
        type: String,
        enum: ['startup', 'small', 'medium', 'large', 'enterprise', 'freelancer'],
        default: 'small',
      },
      location: {
        city: {
          type: String,
          default: '',
          maxlength: [100, 'City cannot exceed 100 characters'],
        },
        country: {
          type: String,
          default: 'India',
          maxlength: [100, 'Country cannot exceed 100 characters'],
        },
        workMode: {
          type: String,
          enum: ['remote', 'onsite', 'hybrid', 'flexible'],
          default: 'hybrid',
        },
      },
    },
  },
  leadGenerationGoals: {
    primaryObjective: {
      type: String,
      enum: ['job_search', 'client_acquisition', 'partnership_building', 'networking', 'brand_building', 'knowledge_sharing', 'recruitment', 'sales_prospecting', 'investment_seeking', 'mentorship'],
      default: 'networking',
    },
    targetAudience: {
      roles: {
        type: [String],
        default: [],
        validate: {
          validator: function (v) {
            return v.length <= 20;
          },
          message: 'Cannot have more than 20 target roles',
        },
      },
      industries: {
        type: [String],
        default: [],
        validate: {
          validator: function (v) {
            return v.length <= 20;
          },
          message: 'Cannot have more than 20 target industries',
        },
      },
      companySizes: {
        type: [String],
        enum: ['startup', 'small', 'medium', 'large', 'enterprise'],
        default: [],
      },
      seniority: {
        type: [String],
        enum: ['entry', 'junior', 'mid', 'senior', 'executive', 'founder'],
        default: [],
      },
    },
    serviceOfferings: {
      type: [String],
      default: [],
      validate: {
        validator: function (v) {
          return v.length <= 15;
        },
        message: 'Cannot have more than 15 service offerings',
      },
    },
    businessType: {
      type: String,
      enum: ['b2b', 'b2c', 'b2b2c', 'freelancer', 'job_seeker', 'entrepreneur'],
      default: 'b2b',
    },
    automation: {
      isEnabled: {
        type: Boolean,
        default: false,
        description: 'Master switch to enable/disable all automation features',
      },
      automationType: {
        type: String,
        enum: ['semi', 'full', 'none'],
        default: 'none',
        description: 'Type of automation workflow to implement',
      },
      executionMode: {
        type: String,
        enum: ['realtime', 'scheduled', 'manual', 'hybrid'],
        default: 'manual',
        description: 'How automation tasks should be executed',
      },
      schedule: {
        frequency: {
          type: String,
          enum: ['daily', 'weekly', 'bi-weekly', 'monthly', 'custom'],
          default: 'weekly',
          description: 'How often scheduled automation runs',
        },
        timeOfDay: {
          type: String,
          match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
          default: '09:00',
          description: 'Time of day to run automation (24-hour format)',
        },
        daysOfWeek: {
          type: [String],
          enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
          default: ['monday', 'wednesday', 'friday'],
          description: 'Days of week for scheduled execution',
        },
        timezone: {
          type: String,
          default: 'UTC',
          description: 'Timezone for scheduled execution',
        },
        customCronExpression: {
          type: String,
          default: null,
          description: 'Custom cron expression for complex scheduling',
        },
      },
    },
  },
  customRequirements: {
    type: String,
    default: '',
  },
});

const Member = newDBConnection.model('Member', MemberSchema);
module.exports = Member;
