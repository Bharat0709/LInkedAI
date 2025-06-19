const mongoose = require('mongoose');
const { newDBConnection } = require('../db');
const validator = require('validator');

const MemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please Provide Your Name'],
  },
  email: {
    type: String,
    validate: [validator.isEmail, 'Please Provide a Valid Email'],
    unique: true,
    required: [true, 'Please Provide an Email'],
  },
  timeZone: {
    type: String,
    default: 'Asia/Kolkata',
  },
  profileLink: {
    type: String,
    default: '',
  },
  profilePicture: {
    type: String,
    default:
      'https://firebasestorage.googleapis.com/v0/b/coldemail-2d11a.appspot.com/o/Avatar.png?alt=media&token=b07b4ca9-074c-465e-985b-7c6e562f2e7b',
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  credits: {
    type: Number,
    default: 100,
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  role: {
    type: String,
    enum: ['member', 'profile', 'admin', 'owner'],
    default: 'profile',
  },
  plan: {
    type: String,
    enum: ['Free', 'Plus', 'Pro', 'Ultra'],
    default: 'Free',
  },
  leaderBoardProfileVisibility: {
    type: Boolean,
    default: true,
  },
  tagPost: {
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
  currentStreak: {
    type: Number,
    default: 0,
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
  appPassword: {
    type: String,
    select: false,
  },
  emailProvider: {
    type: String,
    enum: ['gmail', 'outlook', 'yahoo', 'custom', ''],
    default: '',
  },
  postSavingPreferences: {
    enabled: {
      type: Boolean,
      default: true,
    },
    enableCustomKeywords: {
      type: Boolean,
      default: false,
    },
    keywords: {
      type: [String],
      default: [],
    },
    excludeKeywords: {
      type: [String],
      default: [],
    },
    saveAllPosts: {
      type: Boolean,
      default: false,
    },
    maxPostsPerDay: {
      type: Number,
      default: 100,
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
    },
  },
  summary: {
    professionalProfile: {
      currentRole: {
        type: String,
        default: '', // e.g., "Software Developer", "Digital Marketer", "Student"
      },
      profileDescription: {
        type: String,
        default: '', // e.g., "Experienced software developer with a passion for building scalable applications."
      },
      experienceLevel: {
        type: String,
        enum: [
          'entry',
          'junior',
          'mid',
          'senior',
          'executive',
          'student',
          'fresher',
        ],
        default: 'entry',
      },
      industry: {
        type: String,
        default: '', // e.g., "Technology", "Healthcare", "Finance", "Education"
      },
      functionalArea: {
        type: [String],
        default: [], // e.g., ["Marketing", "Sales", "Development", "Design"]
      },
      companySize: {
        type: String,
        enum: [
          'startup',
          'small',
          'medium',
          'large',
          'enterprise',
          'freelancer',
        ],
        default: 'small',
      },
      location: {
        city: {
          type: String,
          default: '',
        },
        country: {
          type: String,
          default: 'India',
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
      enum: [
        'job_search',
        'client_acquisition',
        'partnership_building',
        'networking',
        'brand_building',
        'knowledge_sharing',
        'recruitment',
        'sales_prospecting',
        'investment_seeking',
        'mentorship',
      ],
      default: 'networking',
    },
    targetAudience: {
      roles: {
        type: [String],
        default: [], // e.g., ["HR Manager", "CTO", "Marketing Director"]
      },
      industries: {
        type: [String],
        default: [], // e.g., ["SaaS", "E-commerce", "FinTech"]
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
      default: [], // e.g., ["Web Development", "Digital Marketing", "Consulting"]
    },
    businessType: {
      type: String,
      enum: ['b2b', 'b2c', 'b2b2c', 'freelancer', 'job_seeker', 'entrepreneur'],
      default: 'b2b',
    },
  },
});

MemberSchema.methods.setAppPassword = async function (password) {
  const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  this.appPassword = encrypted;
};

MemberSchema.methods.getAppPassword = async function () {
  if (!this.appPassword) return null;
  const decipher = crypto.createDecipher(
    'aes-256-cbc',
    process.env.ENCRYPTION_KEY
  );
  let decrypted = decipher.update(this.appPassword, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

const Member = newDBConnection.model('Member', MemberSchema);
module.exports = Member;
