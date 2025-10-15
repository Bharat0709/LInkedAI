const mongoose = require('mongoose');
const { newDBConnection } = require('../config/db');

const stateStoreSchema = new mongoose.Schema({
  state: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  csrfToken: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
  },
  email: String,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, 
  },
});

// Create compound index for faster lookups
stateStoreSchema.index({ state: 1, csrfToken: 1 });
const stateStore  = newDBConnection.model('StateStore', stateStoreSchema);

module.exports = stateStore;