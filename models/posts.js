const mongoose = require('mongoose');
const { newDBConnection } = require('../db');

const PostSchema = new mongoose.Schema({
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
  author: {
    name: {
      type: String,
      required: [true, 'Author name is required'],
    },
    profilePicture: {
      type: String,
      default: '',
    },
  },
  numImpressions: {
    type: Number,
    default: 0,
  },
  numLikes: {
    type: Number,
    default: 0,
  },
  numComments: {
    type: Number,
    default: 0,
  },
  numShares: {
    type: Number,
    default: 0,
  },
  numViews: {
    type: Number,
    default: 0,
  },
  postedAround: {
    type: String,
    default: '',
  },
  shareUrl: {
    type: String,
    required: [true, 'Post link is required'],
  },
  textContent: {
    type: String,
    default: '',
  },
  postUrn: {
    type: String,
    required: [true, 'Post URN is required'],
  },
  media: {
    type: {
      type: String,
      enum: ['image', 'video', 'text', 'none'],
      default: 'none',
    },
    url: {
      type: String,
      default: '',
    },
  },
});

const Post = newDBConnection.model('Post', PostSchema);
module.exports = Post;
