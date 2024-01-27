const User = require("./../models/userModel");
const GuestUser = require("../models/guestUser");
const jwt = require("jsonwebtoken");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const { promisify } = require("util");

exports.addtoguestuser = catchAsync(async (req, res, next) => {
  const { name, profileLink } = req.body;

  const existingUser = await GuestUser.findOne({ profileLink });
  if (existingUser) {
    const userObj = {
      _id: existingUser._id,
      name: existingUser.name,
      profileLink: existingUser.profileLink,
      credits: existingUser.credits,
      plan: existingUser.plan,
      email: existingUser.email,
    };
    createSendToken(userObj, 200, res);
  }

  if (!existingUser) {
    const user = new GuestUser({
      name: req.body.name,
      profileLink: req.body.profileLink,
    });

    const data = await user.save();
    const userObj = {
      _id: data._id,
      name: data.name,
      profileLink: data.profileLink,
      credits: data.credits,
      plan: data.plan,
    };
    createSendToken(userObj, 200, res);
  }
});

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

exports.addemail = catchAsync(async (req, res, next) => {
  console.log(req.body);
  const { email } = req.body;
  const user = req.user;

  console.log(email, user);

  // Check if the requested email already exists
  const existingUser = await GuestUser.findOne({ email });

  if (existingUser) {
    res.status(400).json({ success: false });
    return next(new AppError("Email Already Exists", 400));
  }

  // Update GuestUser with the new email
  user.email = email;
  user.credits += 50;
  await GuestUser.findByIdAndUpdate(user._id, {
    email: user.email,
    credits: user.credits,
  });

  // Return success response
  res.status(200).json({ success: true, user });
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
  const freshUser = await GuestUser.findById(decoded.id);

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
      name: freshUser.name,
      profileLink: freshUser.profileLink,
      credits: freshUser.credits,
      plan: freshUser.plan,
      email: freshUser.email,
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
  const freshUser = await GuestUser.findById(decoded.id);

  if (!freshUser) {
    return next(
      new AppError("The User Belonging to this token does not exists", 401)
    );
  }
  console.log(freshUser);
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
