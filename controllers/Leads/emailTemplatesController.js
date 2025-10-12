const catchAsync = require('../../utils/catchAsync');
const emailTemplateService = require('../../services/EmailTemplates/emailTemplatesService');
const AppError = require('../../utils/appError');

// CREATE NEW EMAIL TEMPLATE
exports.createEmailTemplate = catchAsync(async (req, res, next) => {
  const { name, description, subject, templateBody, templateType, category, placeholders } = req.body;
  const memberId = req.params.memberId;
  const organizationId = req.organization._id;

  const template = await emailTemplateService.createEmailTemplate(memberId, organizationId, {
    name,
    description,
    subject,
    templateBody,
    templateType,
    category,
    placeholders,
  });

  res.status(201).json({
    status: 'success',
    message: 'Email template created successfully',
    data: {
      template,
    },
  });
});

// GET TEMPLATE BY ID
exports.getEmailTemplate = catchAsync(async (req, res, next) => {
  const { templateId } = req.params;
  const memberId = req.params.memberId;
  const organizationId = req.organization._id;

  const template = await emailTemplateService.getTemplateById(templateId, memberId, organizationId);

  res.status(200).json({
    status: 'success',
    data: {
      template,
    },
  });
});

// GET TEMPLATE BY ID
exports.getEmailTemplateAdmin = catchAsync(async (req, res, next) => {
  const { templateId } = req.params;
  const memberId = req.params.memberId;
  const organizationId = req.params.organizationId;

  const template = await emailTemplateService.getTemplateById(templateId, memberId, organizationId);

  res.status(200).json({
    status: 'success',
    data: {
      template,
    },
  });
});

// GET ALL TEMPLATES FOR CURRENT MEMBER
exports.getMemberTemplatesAdmin = catchAsync(async (req, res, next) => {
  const memberId = req.params.memberId;
  const organizationId = req.params.organizationId;

  const templates = await emailTemplateService.getMemberTemplates(memberId, organizationId);

  res.status(200).json({
    status: 'success',
    results: templates.length,
    data: {
      templates,
    },
  });
});

// GET ALL TEMPLATES FOR CURRENT MEMBER
exports.getMemberTemplates = catchAsync(async (req, res, next) => {
  const memberId = req.params.memberId;
  const organizationId = req.organization._id;

  const templates = await emailTemplateService.getMemberTemplates(memberId, organizationId);

  res.status(200).json({
    status: 'success',
    results: templates.length,
    data: {
      templates,
    },
  });
});

// GET ALL TEMPLATES FOR ORGANIZATION (ADMIN/OWNER ONLY)
exports.getOrganizationTemplates = catchAsync(async (req, res, next) => {
  const organizationId = req.organization._id;
  const { page, limit, category, templateType } = req.query;

  const filters = {};
  if (category) filters.category = category;
  if (templateType) filters.templateType = templateType;

  const result = await emailTemplateService.getOrganizationTemplates(organizationId, parseInt(page), parseInt(limit), filters);

  res.status(200).json({
    status: 'success',
    results: result.templates.length,
    data: result,
  });
});

// GET TEMPLATES BY CATEGORY
exports.getTemplatesByCategory = catchAsync(async (req, res, next) => {
  const { category } = req.params;
  const organizationId = req.organization._id;

  const templates = await emailTemplateService.getTemplatesByCategory(organizationId, category);

  res.status(200).json({
    status: 'success',
    results: templates.length,
    data: {
      templates,
    },
  });
});

// SEARCH TEMPLATES
exports.searchTemplates = catchAsync(async (req, res, next) => {
  const { query } = req.query;
  const organizationId = req.organization._id;

  if (!query) {
    return next(new AppError('Search query is required', 400));
  }

  const templates = await emailTemplateService.searchTemplates(organizationId, query);

  res.status(200).json({
    status: 'success',
    results: templates.length,
    data: {
      templates,
    },
  });
});

// UPDATE EMAIL TEMPLATE
exports.updateEmailTemplate = catchAsync(async (req, res, next) => {
  const { templateId } = req.params;
  const memberId = req.params.memberId;
  const organizationId = req.organization._id;
  const updateData = req.body;

  const template = await emailTemplateService.updateEmailTemplate(templateId, memberId, organizationId, updateData);

  res.status(200).json({
    status: 'success',
    message: 'Template updated successfully',
    data: {
      template,
    },
  });
});

// DELETE EMAIL TEMPLATE
exports.deleteEmailTemplate = catchAsync(async (req, res, next) => {
  const { templateId } = req.params;
  const memberId = req.params.memberId;
  const organizationId = req.organization._id;

  await emailTemplateService.deleteEmailTemplate(templateId, memberId, organizationId);

  res.status(200).json({
    status: 'success',
    message: 'Template deleted successfully',
  });
});

// SET DEFAULT TEMPLATE
exports.setDefaultTemplate = catchAsync(async (req, res, next) => {
  const { templateId } = req.params;
  const { category } = req.body;
  const memberId = req.params.memberId;
  const organizationId = req.organization._id;

  const template = await emailTemplateService.setDefaultTemplate(templateId, memberId, organizationId, category);

  res.status(200).json({
    status: 'success',
    message: 'Default template set successfully',
    data: {
      template,
    },
  });
});

// CLONE/DUPLICATE TEMPLATE
exports.cloneTemplate = catchAsync(async (req, res, next) => {
  const { templateId } = req.params;
  const { newName } = req.body;
  const memberId = req.params.memberId;
  const organizationId = req.organization._id;

  const template = await emailTemplateService.cloneTemplate(templateId, memberId, organizationId, newName);

  res.status(201).json({
    status: 'success',
    message: 'Template cloned successfully',
    data: {
      template,
    },
  });
});

// GET DEFAULT TEMPLATES
exports.getDefaultTemplates = catchAsync(async (req, res, next) => {
  const memberId = req.params.memberId;
  const organizationId = req.organization._id;

  const templates = await emailTemplateService.getDefaultTemplates(memberId, organizationId);

  res.status(200).json({
    status: 'success',
    results: templates.length,
    data: {
      templates,
    },
  });
});

// ADD PLACEHOLDER TO TEMPLATE
exports.addPlaceholder = catchAsync(async (req, res, next) => {
  const { templateId } = req.params;
  const { placeholders } = req.body;
  const memberId = req.params.memberId;
  const organizationId = req.organization._id;

  if (!placeholders) {
    return next(new AppError('Placeholder is required', 400));
  }

  const template = await emailTemplateService.addPlaceholder(templateId, memberId, organizationId, placeholders);

  res.status(200).json({
    status: 'success',
    message: 'Placeholder added successfully',
    data: {
      template,
    },
  });
});

// REMOVE PLACEHOLDER FROM TEMPLATE
exports.removePlaceholder = catchAsync(async (req, res, next) => {
  const { templateId } = req.params;
  const { placeholder } = req.body;
  const memberId = req.params.memberId;
  const organizationId = req.organization._id;

  if (!placeholder) {
    return next(new AppError('Placeholder is required', 400));
  }

  const template = await emailTemplateService.removePlaceholder(templateId, memberId, organizationId, placeholder);

  res.status(200).json({
    status: 'success',
    message: 'Placeholder removed successfully',
    data: {
      template,
    },
  });
});

// GET TEMPLATE STATISTICS
exports.getTemplateStats = catchAsync(async (req, res, next) => {
  const memberId = req.params.memberId;
  const organizationId = req.organization._id;

  const stats = await emailTemplateService.getTemplateStats(memberId, organizationId);

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});

// BULK DELETE TEMPLATES
exports.bulkDeleteTemplates = catchAsync(async (req, res, next) => {
  const { memberId, templateIds } = req.body;

  const organizationId = req.organization._id;

  if (!templateIds || !Array.isArray(templateIds) || templateIds.length === 0) {
    return next(new AppError('Template IDs array is required', 400));
  }

  const results = [];
  for (const templateId of templateIds) {
    try {
      await emailTemplateService.deleteEmailTemplate(templateId, memberId, organizationId);
      results.push({ templateId, status: 'success' });
    } catch (error) {
      results.push({ templateId, status: 'failed', error: error.message });
    }
  }

  res.status(200).json({
    status: 'success',
    message: 'Bulk delete completed',
    data: {
      results,
    },
  });
});

// BULK UPDATE TEMPLATES (CATEGORY, TYPE, ETC.)
exports.bulkUpdateTemplates = catchAsync(async (req, res, next) => {
  const { templateIds, updateData, memberId } = req.body;
  const organizationId = req.organization._id;
  if (!templateIds || !Array.isArray(templateIds) || templateIds.length === 0) {
    return next(new AppError('Template IDs array is required', 400));
  }

  if (!updateData || Object.keys(updateData).length === 0) {
    return next(new AppError('Update data is required', 400));
  }

  const results = [];
  for (const templateId of templateIds) {
    try {
      const template = await emailTemplateService.updateEmailTemplate(templateId, memberId, organizationId, updateData);
      results.push({ templateId, status: 'success', template });
    } catch (error) {
      results.push({ templateId, status: 'failed', error: error.message });
    }
  }

  res.status(200).json({
    status: 'success',
    message: 'Bulk update completed',
    data: {
      results,
    },
  });
});
