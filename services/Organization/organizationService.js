const mailService = require('../../admin/email/admin');
const AppError = require('../../utils/appError');
const fileUploadService = require('../../utils/fileUploadService');
const organizationRepository = require('../../repositories/organizationRepository');
const { logActivity } = require('./organizationHelper');

const getOrganizationById = async id => {
  const organization = await organizationRepository.findById(id);
  if (!organization) {
    throw new AppError('Organization not found.', 404);
  }
  return organization;
};

const checkVerificationStatus = async email => {
  if (!email) {
    throw new AppError('Email is Required', 400);
  }
  const organization = await organizationRepository.findByEmail(email);
  if (organization.isVerified === true) {
    return true;
  } else return false;
};

const updateProfile = async (organizationId, profileData, file) => {
  if (!profileData.name && !file) {
    throw new AppError('Please provide either a name or a profile picture to update.', 400);
  }

  // Check if organization exists
  const organization = await organizationRepository.findById(organizationId);

  if (!organization) {
    throw new AppError('Organization not found.', 404);
  }

  // Prepare update data
  const updateData = {};
  if (profileData.name) updateData.name = profileData.name;

  // Handle file upload if provided
  if (file) {
    const profilePictureUrl = await fileUploadService.uploadProfilePicture(organizationId, file);
    updateData.profilePicture = profilePictureUrl;
  }

  // Update organization profile
  const updatedOrganization = await organizationRepository.updateProfile(organizationId, updateData);

  // Log activity
  await logActivity(organizationId, 'profile_updated', {
    updatedFields: Object.keys(updateData),
  });

  return updatedOrganization;
};

const sendHelpRequestHandler = async (organization, helpTextContent) => {
  // Validate input
  if (!helpTextContent) {
    throw new AppError('Please provide the help text content.', 400);
  }

  // Validate organization
  if (!organization || !organization.email) {
    throw new AppError('Organization details are missing.', 404);
  }

  console.log('Sending help request email...');
  console.log('Help Text Content:', helpTextContent, organization.email, organization.name);
  // Send help request email
  await mailService.sendHelpRequest(organization, helpTextContent);

  // Log activity
  await logActivity(organization._id, 'help_request_sent', {
    helpTextContent: helpTextContent.substring(0, 100) + '...', // Log first 100 chars
  });

  return {
    message: 'Help request has been sent successfully.',
  };
};

const sendFeedbackHandler = async (organization, rating, feedbackContent) => {
  // Validate input
  if (!feedbackContent) {
    throw new AppError('Please provide the feedback content.', 400);
  }

  // Validate organization
  if (!organization || !organization.email) {
    throw new AppError('Organization details are missing.', 404);
  }

  // Validate rating if provided
  if (rating && (rating < 1 || rating > 5)) {
    throw new AppError('Rating must be between 1 and 5.', 400);
  }

  // Send feedback email
  await mailService.sendFeedback(organization, rating, feedbackContent);

  // Log activity
  await logActivity(organization._id, 'feedback_sent', {
    rating,
    feedbackContent: feedbackContent.substring(0, 100) + '...', // Log first 100 chars
  });

  return {
    message: 'Feedback has been sent successfully.',
  };
};

const createOrganization = async organizationData => {
  // Business logic validations
  const existingOrg = await organizationRepository.findByEmail(organizationData.email);
  if (existingOrg) {
    throw new AppError('Organization with this email already exists.', 409);
  }

  const organization = await organizationRepository.create(organizationData);

  // Log activity
  await logActivity(organization._id, 'organization_created', {
    createdAt: new Date(),
  });

  return organization;
};

const deleteOrganization = async (id, softDelete = true) => {
  const organization = await organizationRepository.findById(id);
  if (!organization) {
    throw new AppError('Organization not found.', 404);
  }

  let result;
  if (softDelete) {
    result = await organizationRepository.softDelete(id);
    await logActivity(id, 'organization_soft_deleted', {
      deletedAt: new Date(),
    });
  } else {
    result = await organizationRepository.deletedOrganization(id);
  }

  return result;
};

const getOrganizationProfile = async id => {
  const organization = await organizationRepository.findById(id);
  if (!organization) {
    throw new AppError('Organization not found.', 404);
  }

  return {
    id: organization._id,
    profilePicture: organization.profilePicture,
    name: organization.name,
    timeZone: organization.timeZone,
    lastActive: organization.lastActive,
    email: organization.email,
    credits: organization.credits,
    referralInfo: organization.referral,
    planFeatures: organization.planFeatures,
    createdAt: organization.createdAt,
    isVerified: organization.isVerified,
    payments: organization.payments,
    oauthProvider: organization.oauthProvider,
    isActive: organization.isActive,
    lastActive: organization.lastActive,
    billingDetails: organization.billingDetails,
  };
};

module.exports = {
  // Read / Retrieve
  getOrganizationById,
  getOrganizationProfile,

  // Create / Update
  createOrganization,
  updateProfile,

  // Delete
  deleteOrganization,
  checkVerificationStatus,

  // Communication
  sendHelpRequest: sendHelpRequestHandler,
  sendFeedback: sendFeedbackHandler,
};
