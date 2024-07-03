const mongoose = require('mongoose');
const validator = require('validator');
const { CurrencyCodes } = require('validator/lib/isISO4217');

const GuestUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please Provide Your Name'],
  },
  profileLink: {
    type: String,
    required: [true, 'Profile link not found'],
    unique: true,
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
  role: {
    type: String,
    enum: ['user', 'tester', 'admin'],
    default: 'user',
  },
  plan: {
    type: String,
    enum: ['Free', 'Plus', 'Pro', 'Ultra'],
    default: 'Free',
  },
  email: {
    type: String,
    validate: [validator.isEmail, 'Please Provide a Valid Email'],
    unique: true,
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
  organization: {
    type: String,
    default: 'Personal Account',
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
});
const GuestUser = mongoose.model('guestuser', GuestUserSchema);
module.exports = GuestUser;
