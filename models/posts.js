const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  organizationId: {
    type: String,
    required: [true, 'Organization ID is required'],
  },
  memberId: {
    type: String,
    required: [true, 'Member ID is required'],
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

const Post = mongoose.model('posts', PostSchema);
module.exports = Post;
