const express = require("express");
const authController = require("./../controllers/authController");
const Router = express.Router();

Router.post("/signup", authController.signup);
Router.post("/login", authController.login);
Router.post("/addtoguestuser", authController.addtoguestuser);
Router.get("/checkAuth", authController.protect);
Router.get("/allusers", authController.getAllUsers);
Router.post("/addemail", authController.isLoggedIn, authController.addemail);
Router.post(
  "/daysactive",
  authController.isLoggedIn,
  authController.updateDaysActive
);
Router.get("/checkserver", authController.activateServer);

module.exports = Router;
