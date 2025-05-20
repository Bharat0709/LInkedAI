const express = require('express');
const authController = require('../controllers/authController');
const hiringPostController = require('../controllers/hiringPostsController');
const Router = express.Router();

// Create a new hiring post
Router.post(
  '/',
  authController.isUserLoggedIn,
  hiringPostController.createHiringPost
);

// Get all hiring posts for the authenticated user
Router.get(
  '/',
  authController.isUserLoggedIn,
  hiringPostController.getHiringPosts
);

// Get hiring statistics
Router.get(
  '/stats',
  authController.isUserLoggedIn,
  hiringPostController.getHiringStats
);

// Export hiring posts as CSV
Router.get(
  '/export',
  authController.isUserLoggedIn,
  hiringPostController.exportHiringPosts
);

// Get job role suggestions
Router.get(
  '/job-roles',
  authController.isUserLoggedIn,
  hiringPostController.getJobRoleSuggestions
);

// Bulk update hiring posts
Router.patch(
  '/bulk-update',
  authController.isUserLoggedIn,
  hiringPostController.bulkUpdateHiringPosts
);

// Get a single hiring post
Router.get(
  '/:id',
  authController.isUserLoggedIn,
  hiringPostController.getHiringPost
);

// Update a hiring post status
Router.patch(
  '/:id/status',
  authController.isUserLoggedIn,
  hiringPostController.updateHiringPostStatus
);

// Update a hiring post notes
Router.patch(
  '/:id/notes',
  authController.isUserLoggedIn,
  hiringPostController.updateHiringPostNotes
);

// Update job role
Router.patch(
  '/:id/job-role',
  authController.isUserLoggedIn,
  hiringPostController.updateJobRole
);

// Update candidate requirements
Router.patch(
  '/:id/requirements',
  authController.isUserLoggedIn,
  hiringPostController.updateCandidateRequirements
);

// Contact a hiring post
Router.post(
  '/:id/contact',
  authController.isUserLoggedIn,
  hiringPostController.contactHiringPost
);

// Detect and update job role
Router.post(
  '/:id/detect-job-role',
  authController.isUserLoggedIn,
  hiringPostController.detectJobRole
);

// Delete a hiring post
Router.delete(
  '/:id',
  authController.isUserLoggedIn,
  hiringPostController.deleteHiringPost
);

module.exports = Router;
