const mongoose = require('mongoose');
const moment = require('moment-timezone');
const { newDBConnection } = require('../db');

const ScheduledPostSchema = new mongoose.Schema(
  {
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
    timeZone: {
      type: String,
      required: false,
      default: 'UTC',
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    media: [
      {
        type: {
          type: String,
          enum: ['image', 'pdf', 'video'],
        },
        url: { type: String, required: true },
        title: { type: String },
        description: { type: String },
      },
    ],
    visibility: {
      type: String,
      enum: ['PUBLIC', 'CONNECTIONS_ONLY'],
      default: 'PUBLIC',
    },
    status: {
      type: String,
      enum: ['Scheduled', 'Posted', 'Failed', 'Draft'],
      default: 'Scheduled',
    },
    postDate: {
      type: String,
      required: true,
    },
    postTime: {
      type: String,
      required: true,
    },
    postedAt: {
      type: Date,
    },
    linkedinPostId: {
      type: String,
    },
    effectivePostTime: {
      type: Date,
    },
    postId: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

const ScheduledPost = newDBConnection.model(
  'ScheduledPost',
  ScheduledPostSchema
);
module.exports = ScheduledPost;
