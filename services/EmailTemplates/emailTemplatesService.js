const emailTemplateRepository = require('../../repositories/emailTemplatesRepository');
const { verifyMemberAndOrganization, verifyOrganization } = require('../../middlewares/validateOrg&Member');
const AppError = require('../../utils/appError');

// CREATE A NEW EMAIL TEMPLATE
const createEmailTemplate = async (memberId, organizationId, templateData) => {
  const { name, description, subject, templateBody, templateType, category, placeholders } = templateData;

  // Validate required fields
  if (!name || !subject || !templateBody) {
    throw new AppError('Name, subject, and template body are required', 400);
  }

  // Verify member and organization exist
  await verifyMemberAndOrganization(memberId, organizationId);

  // Check if template name already exists for this member
  const existingTemplate = await emailTemplateRepository.findByNameAndMember(name, memberId, organizationId);
  if (existingTemplate) {
    throw new AppError('Template with this name already exists', 400);
  }

  // Create template data
  const newTemplateData = {
    name: name.trim(),
    description: description?.trim() || '',
    subject: subject.trim(),
    templateBody: templateBody.trim(),
    templateType: templateType || 'html',
    category: category || 'custom',
    placeholders: placeholders || [],
    memberId,
    organizationId,
    isActive: true,
    isDefault: false,
  };

  const template = await emailTemplateRepository.create(newTemplateData);
  return template;
};

// GET TEMPLATE BY ID
const getTemplateById = async (templateId, memberId, organizationId) => {
  if (!templateId) {
    throw new AppError('Template ID is required', 400);
  }

  await verifyMemberAndOrganization(memberId, organizationId);
  const template = await emailTemplateRepository.findByIdMemberAndOrg(templateId, memberId, organizationId);
  if (!template) {
    throw new AppError('Template not found', 404);
  }

  return template;
};

// GET ALL TEMPLATES FOR A MEMBER
const getMemberTemplates = async (memberId, organizationId) => {
  // Verify member and organization exist
  await verifyMemberAndOrganization(memberId, organizationId);

  const templates = await emailTemplateRepository.findByMemberAndOrg(memberId, organizationId);
  return templates;
};

// GET ALL TEMPLATES FOR AN ORGANIZATION
const getOrganizationTemplates = async (organizationId, page, limit, filters = {}) => {
  // Verify organization exists
  await verifyOrganization(organizationId);

  if (page && limit) {
    return await emailTemplateRepository.findWithPagination(organizationId, page, limit, filters);
  }

  const templates = await emailTemplateRepository.findAllByOrganizationId(organizationId);
  return { templates };
};

// GET TEMPLATES BY CATEGORY
const getTemplatesByCategory = async (organizationId, category) => {
  if (!organizationId || !category) {
    throw new AppError('Organization ID and category are required', 400);
  }

  await verifyOrganization(organizationId);

  const templates = await emailTemplateRepository.findByCategory(organizationId, category);
  return templates;
};

// SEARCH TEMPLATES BY NAME
const searchTemplates = async (organizationId, searchTerm) => {
  if (!organizationId || !searchTerm) {
    throw new AppError('Organization ID and search term are required', 400);
  }
  await verifyOrganization(organizationId);
  const templates = await emailTemplateRepository.findByName(organizationId, searchTerm);
  return templates;
};

// UPDATE EMAIL TEMPLATE
const updateEmailTemplate = async (templateId, memberId, organizationId, updateData) => {
  if (!templateId) {
    throw new AppError('Template ID is required', 400);
  }

  await verifyMemberAndOrganization(memberId, organizationId);
  // Verify template exists and belongs to member
  const existingTemplate = await emailTemplateRepository.findByIdMemberAndOrg(templateId, memberId, organizationId);
  if (!existingTemplate) {
    throw new AppError('Template not found', 404);
  }

  // If updating name, check for duplicates
  if (updateData.name && updateData.name !== existingTemplate.name) {
    const duplicateTemplate = await emailTemplateRepository.findByNameAndMember(updateData.name, memberId, organizationId);
    if (duplicateTemplate) {
      throw new AppError('Template with this name already exists', 400);
    }
  }

  // Prepare update data
  const allowedFields = ['name', 'description', 'subject', 'templateBody', 'templateType', 'category', 'placeholders', 'isActive'];
  const filteredUpdateData = {};

  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) {
      filteredUpdateData[field] = updateData[field];
    }
  });

  const updatedTemplate = await emailTemplateRepository.updateByIdMemberAndOrg(templateId, memberId, organizationId, filteredUpdateData);

  return updatedTemplate;
};

// DELETE EMAIL TEMPLATE (SOFT DELETE)
const deleteEmailTemplate = async (templateId, memberId, organizationId) => {
  if (!templateId) {
    throw new AppError('Template ID is required', 400);
  }
  await verifyMemberAndOrganization(memberId, organizationId);
  // Verify template exists and belongs to member
  const template = await emailTemplateRepository.findByIdMemberAndOrg(templateId, memberId, organizationId);
  if (!template) {
    throw new AppError('Template not found', 404);
  }

  const deletedTemplate = await emailTemplateRepository.softDeleteByMemberAndOrg(templateId, memberId, organizationId);
  return deletedTemplate;
};

// SET DEFAULT TEMPLATE
const setDefaultTemplate = async (templateId, memberId, organizationId, category) => {
  await verifyMemberAndOrganization(memberId, organizationId);
  if (!templateId) {
    throw new AppError('Template ID is required', 400);
  }

  // Verify template exists and belongs to member
  const template = await emailTemplateRepository.findByIdMemberAndOrg(templateId, memberId, organizationId);
  if (!template) {
    throw new AppError('Template not found', 404);
  }

  const updatedTemplate = await emailTemplateRepository.setDefaultTemplate(templateId, memberId, organizationId, category || template.category);

  return updatedTemplate;
};

// CLONE/DUPLICATE TEMPLATE
const cloneTemplate = async (templateId, memberId, organizationId, newName) => {
  if (!templateId) {
    throw new AppError('Template ID is required', 400);
  }
  await verifyMemberAndOrganization(memberId, organizationId);

  // Verify original template exists
  const originalTemplate = await emailTemplateRepository.findByIdAndOrg(templateId, organizationId);
  if (!originalTemplate) {
    throw new AppError('Original template not found', 404);
  }

  // Generate unique name if not provided
  if (!newName) {
    newName = `${originalTemplate.name} (Copy)`;

    // Ensure unique name
    let counter = 1;
    let checkName = newName;
    while (await emailTemplateRepository.findByNameAndMember(checkName, memberId, organizationId)) {
      counter++;
      checkName = `${originalTemplate.name} (Copy ${counter})`;
    }
    newName = checkName;
  } else {
    // Check if provided name already exists
    const existingTemplate = await emailTemplateRepository.findByNameAndMember(newName, memberId, organizationId);
    if (existingTemplate) {
      throw new AppError('Template with this name already exists', 400);
    }
  }

  const clonedTemplate = await emailTemplateRepository.cloneTemplate(templateId, newName, memberId);
  return clonedTemplate;
};

// GET DEFAULT TEMPLATES FOR MEMBER
const getDefaultTemplates = async (memberId, organizationId) => {
  if (!memberId || !organizationId) {
    throw new AppError('Member ID and Organization ID are required', 400);
  }

  const defaultTemplates = await emailTemplateRepository.findDefaultByMember(memberId, organizationId);
  return defaultTemplates;
};

// ADD PLACEHOLDER TO TEMPLATE
const addPlaceholder = async (templateId, memberId, organizationId, placeholders) => {
  await verifyMemberAndOrganization(memberId, organizationId);
  console.log(templateId, memberId, organizationId, placeholders);
  if (!templateId || !placeholders) {
    throw new AppError('Template ID and placeholder are required', 400);
  }

  const template = await emailTemplateRepository.findByIdMemberAndOrg(templateId, memberId, organizationId);
  if (!template) {
    throw new AppError('Template not found', 404);
  }

  // Check if placeholder already exists
  if (template.placeholders.includes(placeholders)) {
    throw new AppError('Placeholder already exists', 400);
  }

  // Add placeholder
  const updatedPlaceholders = [...template.placeholders, ...placeholders];
  const updatedTemplate = await emailTemplateRepository.updateByIdMemberAndOrg(templateId, memberId, organizationId, { placeholders: updatedPlaceholders });

  return updatedTemplate;
};

// REMOVE PLACEHOLDER FROM TEMPLATE
const removePlaceholder = async (templateId, memberId, organizationId, placeholder) => {
  if (!templateId || !placeholder) {
    throw new AppError('Template ID and placeholder are required', 400);
  }

  await verifyMemberAndOrganization(memberId, organizationId);
  const template = await emailTemplateRepository.findByIdMemberAndOrg(templateId, memberId, organizationId);
  if (!template) {
    throw new AppError('Template not found', 404);
  }

  // Remove placeholder
  const updatedPlaceholders = template.placeholders.filter(p => p !== placeholder);
  const updatedTemplate = await emailTemplateRepository.updateByIdMemberAndOrg(templateId, memberId, organizationId, { placeholders: updatedPlaceholders });

  return updatedTemplate;
};

// GET TEMPLATE STATISTICS FOR MEMBER
const getTemplateStats = async (memberId, organizationId) => {
  if (!memberId || !organizationId) {
    throw new AppError('Member ID and Organization ID are required', 400);
  }

  const totalTemplates = await emailTemplateRepository.countByMemberId(memberId);
  const templates = await emailTemplateRepository.findByMemberAndOrg(memberId, organizationId);

  const stats = {
    totalTemplates,
    templatesByCategory: {},
    templatesByType: { html: 0, text: 0 },
    defaultTemplates: 0,
  };

  templates.forEach(template => {
    // Count by category
    stats.templatesByCategory[template.category] = (stats.templatesByCategory[template.category] || 0) + 1;

    // Count by type
    stats.templatesByType[template.templateType]++;

    // Count defaults
    if (template.isDefault) {
      stats.defaultTemplates++;
    }
  });

  return stats;
};

module.exports = {
  createEmailTemplate,
  getTemplateById,
  getMemberTemplates,
  getOrganizationTemplates,
  getTemplatesByCategory,
  searchTemplates,
  updateEmailTemplate,
  deleteEmailTemplate,
  setDefaultTemplate,
  cloneTemplate,
  getDefaultTemplates,
  addPlaceholder,
  removePlaceholder,
  getTemplateStats,
};
