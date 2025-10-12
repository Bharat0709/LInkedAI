const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const organizationRepository = require('../../repositories/organizationRepository');
const mailService = require('../../admin/email/organization');
const AppError = require('../../utils/appError');
const { encryptToken } = require('../../utils/linkedInAuth');
const passwordHelper = require('./passwordWindowHelper');
const authHelper = require('./authHelper');
const PASSWORD_RESET_EXPIRY = 10 * 60 * 1000; // 10 minutes

const initiateSignup = async (email, timeZone = 'Asia/Calcutta') => {
  if (!email) {
    throw new AppError('Please provide an email address.', 400);
  }

  const existingOrg = await organizationRepository.findByEmailWithPassword(email);

  // ✅ If user is verified but no password set → send password set mail
  if (existingOrg && existingOrg.isVerified && !existingOrg.password) {
    const resetToken = authHelper.generatePasswordResetToken();
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    await organizationRepository.updateById(existingOrg._id, {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: Date.now() + 10 * 60 * 1000,
    });

    const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}?mode=set&email=${encodeURIComponent(email)}`;
    try {
      await mailService.sendResetPasswordURL(email, 'Set your password (valid for 10 minutes)', resetURL, 'set');
      return {
        isPasswordPresent: false,
        isVerified: true,
        message: 'Account is verified but no password found. Password set mail has been sent to your email.',
      };
    } catch (error) {
      await organizationRepository.clearResetTokens(existingOrg._id);
      throw new AppError('Error sending password set email. Try again later.', 500);
    }
  }

  if (existingOrg && existingOrg.isVerified) {
    throw new AppError('Email already exists and is verified.', 400);
  }

  // ✅ Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationTokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');

  let organization;

  if (existingOrg && !existingOrg.isVerified) {
    // Update unverified org
    organization = await organizationRepository.updateById(existingOrg._id, {
      emailVerificationToken: verificationTokenHash,
      timeZone,
      emailVerificationExpires: Date.now() + 10 * 60 * 1000,
    });
  } else {
    // New org with initial credits
    const organizationData = {
      email,
      timeZone,
      emailVerificationToken: verificationTokenHash,
      emailVerificationExpires: Date.now() + 10 * 60 * 1000,
      credits: {
        balance: 200, // 🎁 Signup bonus
        totalUsed: 0,
        transactions: [
          {
            type: 'bonus',
            amount: 200,
            balance: 200,
            description: 'Signup bonus credits',
          },
        ],
      },
    };
    organization = await organizationRepository.create(organizationData);
  }

  const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;
  try {
    await mailService.sendVerificationMail(email, 'Verify your email', verificationUrl);
    return {
      isPasswordPresent: false,
      isVerified: false,
      message: 'Verification email sent successfully. Please check your inbox.',
      creditsInfo: {
        signupBonus: 200,
        balance: organization.credits.balance,
      },
    };
  } catch (error) {
    await organizationRepository.clearVerificationTokens(organization._id);
    throw new AppError('There was an error sending the email. Try again later.', 500);
  }
};

const verifyEmail = async (token, email) => {
  if (!token || !email) {
    throw new AppError('Please provide verification token and email.', 400);
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const organization = await organizationRepository.findByEmailVerificationToken(email, hashedToken, Date.now());

  if (!organization) {
    throw new AppError('Token is invalid or has expired.', 400);
  }

  // Mark email as verified
  await organizationRepository.updateVerificationStatus(organization._id, true, true);

  await passwordHelper.openPwSetupWindow(organization._id);

  // Add verification to activity log
  const logEntry = {
    action: 'email_verified',
    timestamp: new Date(),
    metadata: {
      verificationMethod: 'email_token',
    },
  };
  await organizationRepository.addToActivityLog(organization._id, logEntry);

  return {
    message: 'Email verified successfully. You can now set your password.',
    organizationId: organization._id,
  };
};

const completeSignup = async (email, password, passwordConfirm) => {
  if (!email || !password || !passwordConfirm) {
    throw new AppError('Please provide all required fields.', 400);
  }

  if (password !== passwordConfirm) {
    throw new AppError('Passwords do not match.', 400);
  }

  // Password validation with detailed response
  const passwordValidation = authHelper.validatePassword(password);
  if (!passwordValidation.isValid) {
    // Return validation details for frontend to show specific requirements
    const error = new AppError('Password validation failed.', 400);
    error.validationDetails = passwordValidation.validation;
    error.validationErrors = passwordValidation.errors;
    throw error;
  }

  const organization = await organizationRepository.findVerifiedByEmail(email);
  if (!organization) {
    throw new AppError('Email not found or not verified. Please verify your email first.', 400);
  }

  if (organization.password) {
    throw new AppError('Password already set for this account.', 400);
  }

  const windowOpen = await passwordHelper.isPwSetupWindowOpen(organization._id);
  if (!windowOpen) {
    throw new AppError('Password setup window expired. Please initiate set password window again.', 400);
  }

  // Hash password and activate account
  const hashedPassword = await bcrypt.hash(password, 12);
  const updateData = {
    password: hashedPassword,
    isActive: true,
  };

  await organizationRepository.updateById(organization._id, updateData);

  return {
    _id: organization._id,
    email: organization.email,
  };
};

const resendVerificationEmail = async email => {
  if (!email) {
    throw new AppError('Please provide an email address.', 400);
  }

  const organization = await organizationRepository.findUnverifiedByEmail(email);
  if (!organization) {
    throw new AppError('Email not found or already verified.', 400);
  }

  // Generate new verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationTokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');

  const updateData = {
    emailVerificationToken: verificationTokenHash,
    emailVerificationExpires: Date.now() + 10 * 60 * 1000,
  };
  await organizationRepository.updateById(organization._id, updateData);

  // Send verification email
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`;

  try {
    await mailService.sendVerificationMail(email, 'Verify your mail (Valid for 10 mins)', verificationUrl);
    return { message: 'Verification email resent successfully.' };
  } catch (error) {
    await organizationRepository.clearVerificationTokens(organization._id);
    throw new AppError('There was an error sending the email. Try again later.', 500);
  }
};

const loginOrganization = async (email, password) => {
  if (!email || !password) {
    throw new AppError('Please provide email and password', 400);
  }

  const organization = await organizationRepository.findByEmailWithPassword(email);
  if (!organization) {
    throw new AppError('User does not exist', 401);
  }

  if (!organization.isVerified) {
    throw new AppError('Please verify your email before logging in.', 401);
  }

  if (!organization.password && organization.oauthProvider === 'google') {
    throw new AppError('Please log in using Google OAuth or Reset your password.', 401);
  }

  const isMatch = await bcrypt.compare(password, organization.password);
  if (!isMatch) {
    await organizationRepository.incrementFailedLoginAttempts(organization._id);
    throw new AppError('Incorrect email or password', 401);
  }

  // Reset failed attempts and update login info
  await organizationRepository.resetFailedLoginAttempts(organization._id);

  // Add login to activity log
  const logEntry = {
    action: 'user_login',
    timestamp: new Date(),
    metadata: {
      method: 'password',
    },
  };
  await organizationRepository.addToActivityLog(organization._id, logEntry);

  // Get updated organization data
  const updatedOrg = await organizationRepository.findById(organization._id);

  return {
    ...updatedOrg.toObject(),
  };
};

const handleGoogleAuth = async profile => {
  try {
    const email = profile.emails[0].value;
    const existingOrg = await organizationRepository.findByEmail(email);

    if (existingOrg) {
      // Update existing organization
      const updateData = {
        name: profile.displayName,
        oauthProvider: 'google',
        oauthId: encryptToken(profile.id),
        profilePicture: profile.photos[0]?.value || null,
        isVerified: true,
        isActive: true,
      };

      // Add login to activity log
      const logEntry = {
        action: 'user_login',
        timestamp: new Date(),
        metadata: {
          method: 'google_oauth',
        },
      };

      await organizationRepository.addToActivityLog(existingOrg._id, logEntry);
      return await organizationRepository.updateById(existingOrg._id, updateData);
    }

    // Create new organization
    const newOrgData = authHelper.createGoogleOrganizationData(profile);
    return await organizationRepository.create(newOrgData);
  } catch (error) {
    throw new AppError('Google authentication failed', 500);
  }
};

const initiatePasswordReset = async email => {
  if (!email) {
    throw new AppError('Please provide email.', 400);
  }

  const organization = await organizationRepository.findByEmail(email);
  if (!organization) {
    throw new AppError('There is no user with that email address.', 404);
  }

  if (!organization.isActive || !organization.isVerified) {
    throw new AppError('Email is not yet verified! Verify your email first.', 401);
  }

  // Mode: set (first time) or reset
  const mode = !organization.password ? 'set' : 'reset';
  // Generate reset token + hash
  const resetToken = authHelper.generatePasswordResetToken();
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Expiry = 10 minutes
  const expiryTime = Date.now() + PASSWORD_RESET_EXPIRY;

  // Update org with token + expiry
  await organizationRepository.updateById(organization._id, {
    resetPasswordToken: hashedToken,
    resetPasswordExpires: expiryTime,
  });

  // Sync Redis window with exact expiry
  const ttlSeconds = Math.ceil((expiryTime - Date.now()) / 1000);
  await passwordHelper.openPwSetupWindow(organization._id, ttlSeconds);

  // Reset URL
  const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}?mode=${mode}&email=${encodeURIComponent(organization.email)}`;

  try {
    await mailService.sendResetPasswordURL(organization.email, mode === 'set' ? 'Set your password (valid for 10 minutes)' : 'Reset your password (valid for 10 minutes)', resetURL, mode);

    // Log activity
    await organizationRepository.addToActivityLog(organization._id, {
      action: mode === 'set' ? 'password_set_initiated' : 'password_reset_initiated',
      timestamp: new Date(),
      metadata: {
        method: 'email_token',
        tokenExpiry: new Date(expiryTime),
        expiresIn: '10 minutes',
      },
    });

    return {
      message: `${mode === 'set' ? 'Set password' : 'Reset password'} link sent to email!`,
      mode,
      expiresAt: new Date(expiryTime),
    };
  } catch (error) {
    await organizationRepository.clearResetTokens(organization._id);
    await passwordHelper.closePwSetupWindow(organization._id);
    throw new AppError('There was an error sending the email. Try again later!', 500);
  }
};

const resetPassword = async (token, password, passwordConfirm) => {
  if (!token || !password || !passwordConfirm) {
    throw new AppError('Please provide all required fields.', 400);
  }

  if (password !== passwordConfirm) {
    throw new AppError('Passwords do not match.', 400);
  }

  // Password validation with detailed response
  const passwordValidation = authHelper.validatePassword(password);
  if (!passwordValidation.isValid) {
    const error = new AppError('Password validation failed.', 400);
    error.validationDetails = passwordValidation.validation;
    error.validationErrors = passwordValidation.errors;
    throw error;
  }

  // Hash the token to compare with stored hash
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find organization with valid token (not expired)
  const organization = await organizationRepository.findByResetToken(hashedToken, Date.now());

  if (!organization) {
    throw new AppError('Token is invalid or has expired. Please request a new password reset link.', 400);
  }

  if (!organization.isActive || !organization.isVerified) {
    throw new AppError('Email is not yet verified! Verify your email first', 401);
  }

  // CRITICAL CHECK: Verify the password setup window is still open
  const windowOpen = await passwordHelper.isPwSetupWindowOpen(organization._id);

  if (!windowOpen) {
    // Clean up expired token
    await organizationRepository.clearResetTokens(organization._id);
    throw new AppError('Password setup window expired. Please request a new password reset link.', 400);
  }

  // Check if token expiry time has passed (double check)
  if (organization.resetPasswordExpires < Date.now()) {
    await organizationRepository.clearResetTokens(organization._id);
    await passwordHelper.closePwSetupWindow(organization._id);
    throw new AppError('Reset token has expired. Please request a new password reset link.', 400);
  }

  // Determine if this is setting password for first time or resetting
  const isFirstTimeSetup = !organization.password;

  // Hash new password and update
  const hashedPassword = await bcrypt.hash(password, 12);

  await organizationRepository.updatePasswordResetStatus(organization._id, hashedPassword);

  // Close the password setup window after successful password update
  await passwordHelper.closePwSetupWindow(organization._id);

  const logEntry = {
    action: isFirstTimeSetup ? 'password_set_completed' : 'password_reset_completed',
    timestamp: new Date(),
    metadata: {
      method: 'email_token',
      isFirstTimeSetup,
      id: organization._id,
    },
  };

  await organizationRepository.addToActivityLog(organization._id, logEntry);

  const updatedOrganization = await organizationRepository.findById(organization._id);

  // Send confirmation email
  mailService.sendPasswordChangedConfirmation(updatedOrganization);

  return {
    _id: updatedOrganization._id,
    email: updatedOrganization.email,
    message: isFirstTimeSetup ? 'Password set successfully!' : 'Password reset successfully!',
  };
};

module.exports = {
  initiateSignup,
  verifyEmail,
  completeSignup,
  resendVerificationEmail,
  loginOrganization,
  handleGoogleAuth,
  initiatePasswordReset,
  resetPassword,
};
