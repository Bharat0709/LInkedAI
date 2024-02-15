const express = require("express");
const authController = require("./../controllers/authController");
const Router = express.Router();

Router.post("/signup", authController.signup);
Router.post("/login", authController.login);
Router.post("/addtoguestuser", authController.addtoguestuser);
Router.get("/checkAuth", authController.protect);
Router.get("/users", authController.isLoggedIn, authController.getAllUsers);
Router.post("/checkemail", authController.checkEmailExists);
Router.post(
  "/daysactive",
  authController.isLoggedIn,
  authController.updateDaysActive
);
Router.post(
  "/lbprofilevisibility",
  authController.isLoggedIn,
  authController.updateLeaderboardProfileVisibility
);
Router.get("/checkserver", authController.activateServer);

module.exports = Router;