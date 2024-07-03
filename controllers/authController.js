const { Collection, Post } = require('./../models/collection'); // Import the Mongoose models
const User = require('./../models/userModel');
const GuestUser = require('../models/guestUser');
const jwt = require('jsonwebtoken');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const { promisify } = require('util');
const Waitlist = require('../models/waitlist');
const otpCache = require('../utils/cache');

const compareOTP = async (email, otp) => {
  // Retrieve OTP data from the cache based on the provided email
  const otpData = otpCache.get(email);

  if (!otpData) {
    return false; // OTP data not found in cache
  }

  return otpData.otp === otp && otpData.expiresAt > Date.now();
};

exports.verifyOTP = async (req, res, next) => {
  const { otp, email } = req.body;
  try {
    // Compare the OTP entered by the user
    const isValidOTP = await compareOTP(email, otp);
    if (!isValidOTP) {
      return res.status(400).json({ success: false, invalidOTP: true });
    }
    next();
  } catch (error) {
    return res.status(500).json({ success: false, servererror: true });
  }
};

exports.addtoguestuser = catchAsync(async (req, res, next) => {
  const { otp, name, profileLink, email } = req.body;
  const isValidOTP = await compareOTP(email, otp);
  if (!isValidOTP) {
    return res.status(400).json({ success: false, invalidOTP: true });
  }

  const existingUser = await GuestUser.findOne({ profileLink });
  const existingEmail = await GuestUser.findOne({ email });

  if (existingEmail) {
    res.status(400).json({ success: false, alreadyExists: true });
    return next(new AppError('Email Already Exists', 400));
  }
  if (existingUser && existingUser.email) {
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
      totalCreditsUsed: existingUser.totalCreditsUsed,
      lastActive: existingUser.lastActive,
      currentStreak: existingUser.currentStreak,
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
      totalCreditsUsed: data.totalCreditsUsed,
      lastActive: data.lastActive,
      currentStreak: data.currentStreak,
    };
    createSendToken(userObj, 200, res);
  }
});

exports.addtoWaitlist = catchAsync(async (req, res, next) => {
  try {
    const { email } = req.body;

    // Check if the email is already in the waitlist
    const existingUser = await Waitlist.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: 'Email is already in the waitlist' });
    }

    // Create a new waitlisted user
    const newUser = new Waitlist({ email });
    await newUser.save();

    return res.status(201).json(newUser);
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

exports.checkEmailExists = catchAsync(async (req, res, next) => {
  const { name, profileLink } = req.body;
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
      totalCreditsUsed: existingUser.totalCreditsUsed,
      lastActive: existingUser.lastActive,
      currentStreak: existingUser.currentStreak,
    };
    createSendToken(userObj, 200, res);
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
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }
  res.cookie('jwt', token, cookieOptions);
  res.status(statusCode).json({
    status: 'success',
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
  const { activeDays, currentStreak } = req.body;
  const user = req.user;
  // Update GuestUser with the new email
  user.lastActive = Date.now();
  user.credits = 100;
  user.currentStreak = currentStreak;

  // Update user details in the database (replace this with your actual logic)
  await GuestUser.findByIdAndUpdate(user._id, {
    credits: user.credits,
    lastActive: user.lastActive,
  });

  user.daysActive = activeDays;
  await GuestUser.findByIdAndUpdate(user._id, {
    daysActive: user.daysActive,
    currentStreak: user.currentStreak,
  });

  res.status(200).json({ success: true, user });
});

// Define rate limit settings
const rateLimitOpts = {
  points: 4, // 1 request
  duration: 60, // per 60 seconds
};

// Create a rate limiter instance
const rateLimiter = new RateLimiterMemory(rateLimitOpts);

// Middleware to handle rate limiting
const rateLimitMiddleware = async (req, res, next) => {
  try {
    // Get user ID from the request (assuming user is authenticated)
    const userId = req.user.id;

    // Consume a point from the user's rate limiter
    await rateLimiter.consume(userId);

    // If the request is within the limit, continue to the next middleware
    next();
  } catch (err) {
    // If the user has exceeded the limit, send an error response
    res.status(429).json({
      success: false,
      message: 'Too many requests, please try again later.',
    });
  }
};

// Apply rate limiting middleware to the updateLeaderboardProfileVisibility function
exports.updateLeaderboardProfileVisibility = [
  rateLimitMiddleware,
  catchAsync(async (req, res, next) => {
    const { leaderBoardProfileVisibility } = req.body;
    const user = req.user;

    // Update GuestUser with the new email
    user.leaderBoardProfileVisibility = leaderBoardProfileVisibility;
    await GuestUser.findByIdAndUpdate(user._id, {
      leaderBoardProfileVisibility: user.leaderBoardProfileVisibility,
    });

    // Return success response
    res.status(200).json({ success: true, user });
  }),
];

exports.getAllUsers = catchAsync(async (req, res, next) => {
  // Fetch all users
  const allUsers = await GuestUser.find();

  // Respond with the user data
  res.status(200).json({
    status: 'success',
    users: allUsers,
  });
});

// LOGGING IN THE USER
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // IF email and password exists
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }
  // check user exists and password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or Password'), 401);
  }
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  // 1. Get  token and check if it exixts
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('You are not logged in Login to Get Access'), 401);
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3. Check If User Exists
  const freshUser = await GuestUser.findById(decoded.id);

  if (!freshUser) {
    return next(
      new AppError('The User Belonging to this token does not exists', 401)
    );
  }
  // req.user = freshUser;
  res.status(200).json({
    status: 'success',
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
      totalCreditsUsed: freshUser.totalCreditsUsed,
      lastActive: freshUser.lastActive,
      currentStreak: freshUser.currentStreak,
    },
  });
});

exports.isLoggedIn = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(new AppError('You are not logged in Login to Get Access'), 401);
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3. Check If User Exists
  const freshUser = await GuestUser.findById(decoded.id);

  if (!freshUser) {
    return next(
      new AppError('The User Belonging to this token does not exists', 401)
    );
  }
  req.user = freshUser;
  next();
});

exports.activateServer = catchAsync(async (req, res, next) => {
  res.status(200).json({ server: 'Server is active' });
});

// Function to add a new post to a collection
exports.addtocollection = catchAsync(async (req, res, next) => {
  try {
    const userId = req.user._id; // Assuming user ID is available in req.user
    const { collectionId, collectionName, postURL, postDescription } = req.body;
    let collection;

    // If the collectionId is provided, find the collection by ID
    if (collectionId && collectionId != null) {
      collection = await Collection.findById(collectionId);
    } else {
      // If the collectionId is not provided, create a new collection
      collection = new Collection({
        name: collectionName,
        userId: userId,
      });

      // Check if the user has reached the limit of 5 collections
      const userCollectionsCount = await Collection.countDocuments({
        userId: userId,
      });
      if (userCollectionsCount >= 10) {
        throw new Error('Maximum limit of 10 collections reached');
      }

      await collection.save();
    }

    // Check if the collection has reached the limit of 10 posts
    if (collection.posts.length >= 10) {
      throw new Error('Maximum limit of 10 posts per collection reached');
    }

    // Create a new post
    const newPost = new Post({
      url: postURL,
      description: postDescription,
    });

    // Add the new post to the collection
    collection.posts.push(newPost);
    await collection.save();
    res.status(200).json({ collection });
  } catch (error) {
    throw new Error('Failed to add post');
  }
});

exports.browseCollections = catchAsync(async (req, res, next) => {
  try {
    const userId = req.user.id; // Assuming user ID is available in req.user

    // Find all collections associated with the user
    const collections = await Collection.find({ userId: userId });

    res.status(200).json({ collections });
  } catch (error) {
    throw new Error('Failed to browse collections');
  }
});

exports.deleteCollectionPost = catchAsync(async (req, res, next) => {
  const userId = req.user._id; // Assuming the user ID is stored in req.user._id
  const collectionId = req.params.collectionId;
  const postId = req.params.postId;

  try {
    // Find the collection by its ID
    const collection = await Collection.findById(collectionId);

    if (!collection) {
      return res
        .status(404)
        .json({ success: false, message: 'Collection not found' });
    }

    // Check if the collection belongs to the user
    if (!collection.userId.equals(userId)) {
      return res
        .status(403)
        .json({ success: false, message: 'Unauthorized access' });
    }

    // Find the post within the collection by its ID
    const post = collection.posts.find((post) => post._id.equals(postId));

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: 'Post not found in the collection' });
    }

    // Remove the post from the collection
    collection.posts.pull(post._id);
    await collection.save();

    // Delete the post document from the database
    await Post.findByIdAndDelete(postId);

    res
      .status(200)
      .json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting post' });
  }
});

exports.deleteCollection = catchAsync(async (req, res, next) => {
  const collectionId = req.params.collectionId;

  try {
    const collection = await Collection.findById(collectionId);

    // Check if the collection exists
    if (!collection) {
      return res
        .status(404)
        .json({ success: false, message: 'Collection not found' });
    }

    // Check if the collection belongs to the current user
    if (collection.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: 'Unauthorized access' });
    }

    // Delete the collection
    await Collection.findByIdAndDelete(collectionId);
    res
      .status(200)
      .json({ success: true, message: 'Collection deleted successfully' });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Error deleting collection' });
  }
});

// RESTRICTING THE USER FROM DELETING THE TOURS BASEDON THEIR ROLES
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};
