const mongoose = require('mongoose');
const { newDBConnection } = require('../db');

const ContentCalendarSchema = new mongoose.Schema({
  topic: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true,
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  status: {
    type: String,
    enum: ['Planned', 'Scheduled', 'Posted'],
    default: 'Planned',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  tags: [
    {
      type: String,
    },
  ],
});

module.exports = newDBConnection.model(
  'ContentCalendar',
  ContentCalendarSchema
);
