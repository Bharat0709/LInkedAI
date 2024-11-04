const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    validate: [validator.isEmail, 'Please Provide a Valid Email'],
  },
  name: {
    type: String,
    required: [true, 'Please Provide Your Name'],
  },
  passwordChangedAt: { type: Date },
  role: {
    type: String,
    enum: ['user', 'tester', 'admin'],
    default: 'user',
  },
  plan: {
    type: String,
    enum: ['Free', 'Plus', 'Pro', 'Ultra'],
    default: 'Free',
  },
  password: {
    select: false,
    type: String,
    required: [true, 'Please Provide a Password '],
    minlength: 8,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please Confirm Your Passward'],
    validate: {
      //This only works on SAVE
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not same',
    },
  },
  credits: {
    type: Number,
    default: 100,
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: false,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  //only run if password is modified
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  // delete the password confirm fieled
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre('find', function (next) {
  // This function will run before any 'find' operation
  this.find({ active: { $ne: false } }); // Modify the query if needed
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};


const User = mongoose.model('User', userSchema);
module.exports = User;
