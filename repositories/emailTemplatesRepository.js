const EmailTemplate = require('../models/emailTemplates');

// FIND EMAIL TEMPLATE BY ID
const findById = async id => {
  return await EmailTemplate.findById(id);
};

// FIND BY ID AND ORGANIZATION
const findByIdAndOrg = async (templateId, organizationId) => {
  return await EmailTemplate.findOne({ _id: templateId, organizationId });
};

// FIND BY ID, MEMBER AND ORGANIZATION
const findByIdMemberAndOrg = async (templateId, memberId, organizationId) => {
  return await EmailTemplate.findOne({ _id: templateId, memberId, organizationId });
};

// FIND ALL TEMPLATES BY MEMBER
const findAllByMemberId = async memberId => {
  return await EmailTemplate.find({ memberId, isActive: true }).sort({ createdAt: -1 });
};

// FIND ALL TEMPLATES BY ORGANIZATION
const findAllByOrganizationId = async organizationId => {
  return await EmailTemplate.find({ organizationId, isActive: true }).sort({ createdAt: -1 });
};

// FIND TEMPLATES BY MEMBER AND ORGANIZATION
const findByMemberAndOrg = async (memberId, organizationId) => {
  return await EmailTemplate.find({ memberId, organizationId, isActive: true }).sort({ createdAt: -1 });
};

// FIND TEMPLATES BY CATEGORY
const findByCategory = async (organizationId, category) => {
  return await EmailTemplate.find({ organizationId, category, isActive: true }).sort({ createdAt: -1 });
};

// FIND TEMPLATES BY NAME (SEARCH)
const findByName = async (organizationId, searchTerm) => {
  return await EmailTemplate.find({
    organizationId,
    isActive: true,
    name: { $regex: searchTerm, $options: 'i' }
  }).sort({ createdAt: -1 });
};

// FIND DEFAULT TEMPLATES FOR MEMBER
const findDefaultByMember = async (memberId, organizationId) => {
  return await EmailTemplate.find({ 
    memberId, 
    organizationId, 
    isDefault: true, 
    isActive: true 
  }).sort({ createdAt: -1 });
};

// CHECK IF TEMPLATE NAME EXISTS FOR MEMBER
const findByNameAndMember = async (name, memberId, organizationId) => {
  return await EmailTemplate.findOne({ name, memberId, organizationId, isActive: true });
};

// CREATE A NEW EMAIL TEMPLATE
const create = async templateData => {
  const template = new EmailTemplate(templateData);
  return await template.save();
};

// UPDATE TEMPLATE BY ID
const updateById = async (id, updateData) => {
  return await EmailTemplate.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
};

// UPDATE TEMPLATE BY ID, MEMBER AND ORG (FOR SECURITY)
const updateByIdMemberAndOrg = async (templateId, memberId, organizationId, updateData) => {
  return await EmailTemplate.findOneAndUpdate(
    { _id: templateId, memberId, organizationId },
    updateData,
    { new: true, runValidators: true }
  );
};

// SOFT DELETE TEMPLATE
const softDelete = async id => {
  return await EmailTemplate.findByIdAndUpdate(id, { isActive: false }, { new: true });
};

// SOFT DELETE BY ID, MEMBER AND ORG
const softDeleteByMemberAndOrg = async (templateId, memberId, organizationId) => {
  return await EmailTemplate.findOneAndUpdate(
    { _id: templateId, memberId, organizationId },
    { isActive: false },
    { new: true }
  );
};

// PERMANENT DELETE TEMPLATE
const deleteTemplate = async id => {
  return await EmailTemplate.findByIdAndDelete(id);
};

// COUNT TEMPLATES BY MEMBER
const countByMemberId = async memberId => {
  return await EmailTemplate.countDocuments({ memberId, isActive: true });
};

// COUNT TEMPLATES BY ORGANIZATION
const countByOrganizationId = async organizationId => {
  return await EmailTemplate.countDocuments({ organizationId, isActive: true });
};

// SET DEFAULT TEMPLATE (UNSET OTHERS FIRST)
const setDefaultTemplate = async (templateId, memberId, organizationId, category) => {
  // First, unset all default templates for this member and category
  await EmailTemplate.updateMany(
    { memberId, organizationId, category, isActive: true },
    { isDefault: false }
  );
  
  // Then set the new default
  return await EmailTemplate.findByIdAndUpdate(
    templateId,
    { isDefault: true },
    { new: true }
  );
};

// DUPLICATE/CLONE TEMPLATE
const cloneTemplate = async (templateId, newName, memberId) => {
  const originalTemplate = await EmailTemplate.findById(templateId);
  if (!originalTemplate) return null;

  const clonedData = {
    name: newName || `${originalTemplate.name} (Copy)`,
    description: originalTemplate.description,
    subject: originalTemplate.subject,
    templateBody: originalTemplate.templateBody,
    templateType: originalTemplate.templateType,
    category: originalTemplate.category,
    placeholders: [...originalTemplate.placeholders],
    memberId: memberId || originalTemplate.memberId,
    organizationId: originalTemplate.organizationId,
    isActive: true,
    isDefault: false,
  };

  return await create(clonedData);
};

// GET TEMPLATES WITH PAGINATION
const findWithPagination = async (organizationId, page = 1, limit = 10, filters = {}) => {
  const skip = (page - 1) * limit;
  const query = { organizationId, isActive: true, ...filters };
  
  const templates = await EmailTemplate.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('memberId', 'name email');
    
  const total = await EmailTemplate.countDocuments(query);
  
  return {
    templates,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalTemplates: total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    }
  };
};

module.exports = {
  findById,
  findByIdAndOrg,
  findByIdMemberAndOrg,
  findAllByMemberId,
  findAllByOrganizationId,
  findByMemberAndOrg,
  findByCategory,
  findByName,
  findDefaultByMember,
  findByNameAndMember,
  create,
  updateById,
  updateByIdMemberAndOrg,
  softDelete,
  softDeleteByMemberAndOrg,
  deleteTemplate,
  countByMemberId,
  countByOrganizationId,
  setDefaultTemplate,
  cloneTemplate,
  findWithPagination,
};