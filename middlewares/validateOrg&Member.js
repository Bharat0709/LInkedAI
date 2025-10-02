const memberRepository = require('../repositories/memberRepository');
const organizationRepository = require('../repositories/organizationRepository');
const AppError = require('../utils/appError');

const verifyMemberAndOrganization = async (memberId, organizationId) => {
  if (!memberId) {
    throw new AppError('Member ID is required', 400);
  }

  if (!organizationId) {
    throw new AppError('Organization ID is required', 400);
  }

  // Verify organization exists
  const organization = await organizationRepository.findById(organizationId);
  if (!organization) {
    throw new AppError('Organization not found', 404);
  }

  // Verify member exists and belongs to organization
  const member = await memberRepository.findByIdAndOrg(memberId, organizationId);
  if (!member) {
    throw new AppError('Member not found or does not belong to this organization', 404);
  }

  return { member, organization };
};

const verifyMember = async memberId => {
  if (!memberId) {
    throw new AppError('Member ID is required', 400);
  }

  const member = await memberRepository.findById(memberId);
  if (!member) {
    throw new AppError('Member not found', 404);
  }

  if (!member.active) {
    throw new AppError('Member account is inactive', 403);
  }

  // Also verify the organization
  const organization = await organizationRepository.findById(member.organizationId);
  if (!organization) {
    throw new AppError('Member organization not found', 404);
  }

  if (!organization.isActive) {
    throw new AppError('Organization is inactive', 403);
  }

  return { member, organization };
};

const verifyOrganization = async organizationId => {
  if (!organizationId) {
    throw new AppError('Organization ID is required', 400);
  }

  const organization = await organizationRepository.findById(organizationId);
  if (!organization) {
    throw new AppError('Organization not found', 404);
  }

  if (!organization.isActive) {
    throw new AppError('Organization is inactive', 403);
  }

  return organization;
};

const verifyFromRequest = async req => {
  // Extract IDs from request (could be from req.member, req.organization, or params)
  const memberId = req.member?._id || req.params.memberId;
  const organizationId = req.member?.organizationId || req.organization?._id || req.params.organizationId;

  if (!memberId && !organizationId) {
    throw new AppError('Member or organization identification required', 401);
  }

  // If we have both IDs, verify both
  if (memberId && organizationId) {
    const { member, organization } = await verifyMemberAndOrganization(memberId, organizationId);
    return { memberId, organizationId, member, organization };
  }

  // If we only have memberId, get organization from member
  if (memberId) {
    const { member, organization } = await verifyMember(memberId);
    return {
      memberId,
      organizationId: organization._id,
      member,
      organization,
    };
  }

  // If we only have organizationId
  if (organizationId) {
    const organization = await verifyOrganization(organizationId);
    return { organizationId, organization };
  }
};

module.exports = {
  verifyMemberAndOrganization,
  verifyMember,
  verifyOrganization,
  verifyFromRequest,
};
