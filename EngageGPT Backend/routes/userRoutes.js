const express = require("express");
const authController = require("./../controllers/authController");
const Router = express.Router();

Router.post("/signup", authController.signup);
Router.post("/login", authController.login);
Router.post("/addtowaitlist", authController.addtowaitlist);
Router.get("/checkAuth", authController.protect);
Router.get("/checkserver", authController.activateServer);

module.exports = Router;
