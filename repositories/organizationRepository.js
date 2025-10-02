const Organization = require('../models/organization');

// FIND ORG BY ID
const findById = async id => {
  return await Organization.findById(id).select('-activityLog');
};

const findByEmail = async email => {
  return await Organization.findOne({ email }).select('-activityLog');
};

const findByEmailWithPassword = async email => {
  return await Organization.findOne({ email }).select('+password');
};

const findByResetToken = async (hashedToken, currentTime) => {
  return await Organization.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: currentTime },
  });
};

const findByEmailVerificationToken = async (email, hashedToken, currentTime) => {
  return await Organization.findOne({
    email,
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: currentTime },
    isVerified: false,
    isActive: false,
  });
};

const findUnverifiedByEmail = async email => {
  return await Organization.findOne({
    email,
    isVerified: false,
  });
};

const findVerifiedByEmail = async email => {
  return await Organization.findOne({
    email,
    isVerified: true,
  });
};

const create = async organizationData => {
  const organization = new Organization(organizationData);
  return await organization.save();
};

const getOrganizationCredits = async organizationId => {
  const organization = await findById(organizationId);
  if (!organization) {
    throw new Error('Organization not found');
  }
  return {
    credits: organization.credits.balance || 0,
    totalCreditsUsed: organization.credits.totalUsed || 0,
  };
};

// UPDATE ORG BY ID
const updateById = async (id, updateData) => {
  return await Organization.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
};

const updateProfile = async (id, profileData) => {
  const organization = await Organization.findById(id);
  if (!organization) {
    return null;
  }

  if (profileData.name) organization.name = profileData.name;
  if (profileData.profilePicture) organization.profilePicture = profileData.profilePicture;

  return await organization.save();
};

const deletedOrganization = async id => {
  return await Organization.findByIdAndDelete(id);
};

const softDelete = async id => {
  return await Organization.findByIdAndUpdate(id, { deletedAt: new Date(), isActive: false }, { new: true });
};

const updateLastActive = async id => {
  return await Organization.findByIdAndUpdate(id, { lastActive: new Date() }, { new: true });
};

const addToActivityLog = async (id, logEntry) => {
  return await Organization.findByIdAndUpdate(id, { $push: { activityLog: logEntry } }, { new: true });
};

const updateSecurityInfo = async (id, securityData) => {
  return await Organization.findByIdAndUpdate(id, { $set: securityData }, { new: true });
};

const incrementFailedLoginAttempts = async id => {
  return await Organization.findByIdAndUpdate(id, { $inc: { 'security.failedLoginAttempts': 1 } }, { new: true });
};

const resetFailedLoginAttempts = async id => {
  return await Organization.findByIdAndUpdate(
    id,
    {
      $set: {
        'security.failedLoginAttempts': 0,
        'security.lastLoginAt': new Date(),
        lastActive: new Date(),
      },
    },
    { new: true }
  );
};

const updatePasswordResetStatus = async (id, hashedPassword) => {
  return Organization.findByIdAndUpdate(
    id,
    {
      $set: { password: hashedPassword },
      $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 },
    },
    { new: true }
  );
};

const updateVerificationStatus = async id => {
  return Organization.findByIdAndUpdate(
    id,
    {
      $set: { isVerified: true, isActive: true },
      $unset: { emailVerificationToken: 1, emailVerificationExpires: 1 },
    },
    { new: true }
  );
};

const updateSubscriptionStatus = async (id, status) => {
  return await Organization.findByIdAndUpdate(id, { $set: { 'subscription.status': status } }, { new: true });
};

const clearResetTokens = async id => {
  return await Organization.findByIdAndUpdate(
    id,
    {
      $unset: {
        resetPasswordToken: 1,
        resetPasswordExpires: 1,
      },
    },
    { new: true }
  );
};

const clearVerificationTokens = async id => {
  return await Organization.findByIdAndUpdate(
    id,
    {
      $unset: {
        emailVerificationToken: 1,
        emailVerificationExpires: 1,
      },
    },
    { new: true }
  );
};


module.exports = {
  findById,
  findByEmail,
  findByEmailWithPassword,
  findByResetToken,
  findByEmailVerificationToken,
  findUnverifiedByEmail,
  findVerifiedByEmail,
  create,
  updateById,
  updateProfile,
  deletedOrganization,
  softDelete,
  updateLastActive,
  addToActivityLog,
  updateSecurityInfo,
  incrementFailedLoginAttempts,
  resetFailedLoginAttempts,
  updateVerificationStatus,
  updatePasswordResetStatus,
  updateSubscriptionStatus,
  clearResetTokens,
  clearVerificationTokens,
  getOrganizationCredits,
};
