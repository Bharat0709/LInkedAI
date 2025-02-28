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
});

const Member = newDBConnection.model('Member', MemberSchema);
module.exports = Member;
