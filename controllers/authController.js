const User = require("./../models/userModel");
const GuestUser = require("../models/guestUser");
const jwt = require("jsonwebtoken");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");
const { promisify } = require("util");

exports.addtoguestuser = catchAsync(async (req, res, next) => {
  const { name, profileLink, email } = req.body;

  const existingUser = await GuestUser.findOne({ profileLink });
  const existingEmail = await GuestUser.findOne({ email });

  if (existingEmail) {
    res.status(400).json({ success: false });
    return next(new AppError("Email Already Exists", 400));
  }
  if (existingUser && existingUser.email) {
    console.log(existingUser);
    const userObj = {
      _id: existingUser._id,
      name: existingUser.name,
      profileLink: existingUser.profileLink,
      credits: existingUser.credits,
      plan: existingUser.plan,
      email: existingUser.email,
      daysActive: existingUser.daysActive,
      leaderBoardProfileVisibility: existingUser.leaderBoardProfileVisibility,
      accountCreatedAt: existingUser.accountCreatedAt,
    };
    createSendToken(userObj, 200, res);
  }

  if (!existingUser) {
    const user = new GuestUser({
      name: req.body.name,
      profileLink: req.body.profileLink,
      email: req.body.email,
    });

    const data = await user.save();
    const userObj = {
      _id: data._id,
      name: data.name,
      profileLink: data.profileLink,
      email: data.email,
      credits: data.credits,
      plan: data.plan,
      daysActive: data.daysActive,
      leaderBoardProfileVisibility: data.leaderBoardProfileVisibility,
      accountCreatedAt: data.accountCreatedAt,
    };
    console.log(userObj);
    createSendToken(userObj, 200, res);
  }
});

exports.checkEmailExists = catchAsync(async (req, res, next) => {
  const { name, profileLink } = req.body;
  console.log(name, profileLink);
  const existingUser = await GuestUser.findOne({ profileLink });
  if (existingUser && existingUser.email) {
    const userObj = {
      _id: existingUser._id,
      name: existingUser.name,
      profileLink: existingUser.profileLink,
      email: existingUser.email,
      credits: existingUser.credits,
      plan: existingUser.plan,
      daysActive: existingUser.daysActive,
      leaderBoardProfileVisibility: existingUser.leaderBoardProfileVisibility,
      accountCreatedAt: existingUser.accountCreatedAt,
    };
    createSendToken(userObj, 200, res);
    console.log(existingUser);
  } else {
    res.status(400).json({ success: false });
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
  console.log(user);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") {
    cookieOptions.secure = true;
  }
  res.cookie("jwt", token, cookieOptions);

  res.status(statusCode).json({
    status: "success",
    token,
    user,
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

exports.updateDaysActive = catchAsync(async (req, res, next) => {
  const { activeDays } = req.body;
  const user = req.user;

  // Update GuestUser with the new email
  user.daysActive = activeDays;
  await GuestUser.findByIdAndUpdate(user._id, {
    daysActive: user.daysActive,
  });

  // Return success response
  res.status(200).json({ success: true, user });
});

exports.updateLeaderboardProfileVisibility = catchAsync(
  async (req, res, next) => {
    const { leaderBoardProfileVisibility } = req.body;
    const user = req.user;

    // Update GuestUser with the new email
    user.leaderBoardProfileVisibility = leaderBoardProfileVisibility;
    await GuestUser.findByIdAndUpdate(user._id, {
      leaderBoardProfileVisibility: user.leaderBoardProfileVisibility,
    });

    // Return success response
    res.status(200).json({ success: true, user });
  }
);

exports.getAllUsers = catchAsync(async (req, res, next) => {
  // 1. Fetch all users
  const Existinguser = req.user;
  console.log(Existinguser);
  const allUsers = await GuestUser.find();

  // 2. Create an array to hold user data
  const usersData = allUsers.map((user) => ({
    id: user._id,
    name: user.name,
    daysActive: user.daysActive,
    profileLink: user.profileLink,
    leaderBoardProfileVisibility: user.leaderBoardProfileVisibility,
    // Add other user properties as needed
  }));

  // 3. Respond with the user data
  res.status(200).json({
    status: "success",
    user: Existinguser,
    users: usersData,
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
  const freshUser = await GuestUser.findById(decoded.id);

  if (!freshUser) {
    return next(
      new AppError("The User Belonging to this token does not exists", 401)
    );
  }
  // req.user = freshUser;
  res.status(200).json({
    status: "success",
    user: {
      id: freshUser._id,
      name: freshUser.name,
      profileLink: freshUser.profileLink,
      credits: freshUser.credits,
      plan: freshUser.plan,
      email: freshUser.email,
      daysActive: freshUser.daysActive,
      leaderBoardProfileVisibility: freshUser.leaderBoardProfileVisibility,
      accountCreatedAt: freshUser.accountCreatedAt,
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
