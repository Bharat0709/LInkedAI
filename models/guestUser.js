const mongoose = require("mongoose");
const validator = require("validator");

const GuestUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please Provide Your Name"],
  },
  profileLink: {
    type: String,
    required: [true, "Profile link not found"],
    unique: true,
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  credits: {
    type: Number,
    default: 100,
  },
  role: {
    type: String,
    enum: ["user", "tester", "admin"],
    default: "user",
  },
  plan: {
    type: String,
    enum: ["Free", "Plus", "Pro", "Ultra"],
    default: "Free",
  },
  email: {
    type: String,
    unique: true,
    validate: [validator.isEmail, "Please Provide a Valid Email"],
  },
});
const GuestUser = mongoose.model("guestuser", GuestUserSchema);
module.exports = GuestUser;
