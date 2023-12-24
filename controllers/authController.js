const User = require("./../models/userModel");
const WaitlistedUser = require("../models/waitlistUser");
const jwt = require("jsonwebtoken");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const { promisify } = require("util");

const signToken = (id) => {
  return jwt.sign(
    {
      id,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") {
    cookieOptions.secure = true;
  }
  user.password = undefined;
  res.cookie("jwt", token, cookieOptions);

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const user = new User({
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });
  const data = await user.save();
  const userObj = {
    _id: data._id,
    email: data.email,
    credits: data.credits,
    plan: data.plan,
  };
  createSendToken(userObj, 200, res);
});

exports.addtowaitlist = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const existingUser = await WaitlistedUser.findOne({ email });

  if (existingUser) {
    return res.status(400).json({
      status: "fail",
      message: "User with this email already exists in the waitlist.",
    });
  }

  const user = new WaitlistedUser({
    email: req.body.email,
    name: req.body.name,
  });

  const data = await user.save();
  const userObj = {
    _id: data._id,
    email: data.email,
    name: data.name,
  };

  res.status(200).json({
    status: "success",
    userObj,
  });
});

// LOGGING IN THE USER
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // IF email and password exists
  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }
  // check user exists and password is correct
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or Password"), 401);
  }
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  // 1. Get  token and check if it exixts
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError("You are not logged in Login to Get Access"), 401);
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3. Check If User Exists
  const freshUser = await User.findById(decoded.id);

  if (!freshUser) {
    return next(
      new AppError("The User Belonging to this token does not exists", 401)
    );
  }
  req.user = freshUser;
  res.status(200).json({
    status: "success",
    user: {
      id: freshUser._id,
      email: freshUser.email,
      credits: freshUser.credits,
      plan: freshUser.plan,
    },
  });
});

exports.isLoggedIn = catchAsync(async (req, res, next) => {
  let token;
  // 1. Get  token and check if it exixts
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError("You are not logged in Login to Get Access"), 401);
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3. Check If User Exists
  const freshUser = await User.findById(decoded.id);

  if (!freshUser) {
    return next(
      new AppError("The User Belonging to this token does not exists", 401)
    );
  }
  req.user = freshUser;
  next();
});

exports.activateServer = catchAsync(async (req, res, next) => {
  res.status(200).json({ server: "Server is active" });
});

// RESTRICTING THE USER FROM DELETING THE TOURS BASEDON THEIR ROLES
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }
    next();
  };
};
