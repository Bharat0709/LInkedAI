const mongoose = require('mongoose');

// Define the schema for waitlisted users
const waitlistSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create a model for the waitlisted users
const Waitlist = mongoose.model('Waitlist', waitlistSchema);

module.exports = Waitlist;
