const mongoose = require("mongoose");
const validator = require("validator");

const waitlisteduserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please Provide Your Name"],
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: [validator.isEmail, "Please Provide a Valid Email"],
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

const WaitlistedUser = mongoose.model("WaitlistedUser", waitlisteduserSchema);
module.exports = WaitlistedUser;
