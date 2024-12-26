const express = require('express');
const authController = require('./../controllers/authController');
const collectionController = require('./../controllers/orgAuthController');
const Router = express.Router();

Router.post(
  '/addtocollection',
  authController.isLoggedIn,
  collectionController.addtocollection
);

Router.get(
  '/browsecollections',
  authController.isLoggedIn,
  collectionController.browseCollections
);

Router.delete(
  '/collection/:collectionId',
  authController.isLoggedIn,
  collectionController.deleteCollection
);
Router.delete(
  '/collection/:collectionId/post/:postId',
  authController.isLoggedIn,
  collectionController.deleteCollectionPost
);

module.exports = Router;
