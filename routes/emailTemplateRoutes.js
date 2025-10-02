const express = require('express');
const emailTemplateController = require('../controllers/Leads/emailTemplatesController');
const { verifyToken } = require('../middlewares/verifytoken');

const router = express.Router();
router.get('/:memberId/:organizationId/member-templates', emailTemplateController.getMemberTemplatesAdmin);

// MEMBER SPECIFIC ROUTES WITH TWO PARAMETERS (templateId operations)
router.get('/:templateId/:memberId/:organizationId/admin', emailTemplateController.getEmailTemplateAdmin);
router.use(verifyToken);

// BULK OPERATIONS (Most specific - should come first)
router.delete('/bulk/delete', emailTemplateController.bulkDeleteTemplates);
router.patch('/bulk/update', emailTemplateController.bulkUpdateTemplates);

// ORGANIZATION ROUTES (Static pa ths - should come before parameterized ones)
router.get('/organization/all', emailTemplateController.getOrganizationTemplates);
router.get('/organization/category/:category', emailTemplateController.getTemplatesByCategory);
router.get('/organization/search', emailTemplateController.searchTemplates);

// GENERAL SEARCH AND CATEGORY ROUTES (Static paths)
router.get('/search', emailTemplateController.searchTemplates);
router.get('/category/:category', emailTemplateController.getTemplatesByCategory);

// MEMBER SPECIFIC ROUTES WITH SINGLE PARAMETER
router.post('/:memberId/create', emailTemplateController.createEmailTemplate);
router.get('/:memberId/my-templates', emailTemplateController.getMemberTemplates);
router.get('/:memberId/defaults', emailTemplateController.getDefaultTemplates);
router.get('/:memberId/stats', emailTemplateController.getTemplateStats);

// MEMBER SPECIFIC ROUTES WITH TWO PARAMETERS (templateId operations)
router.get('/:memberId/:templateId', emailTemplateController.getEmailTemplate);
router.patch('/:memberId/:templateId', emailTemplateController.updateEmailTemplate);
router.delete('/:memberId/:templateId', emailTemplateController.deleteEmailTemplate);
router.patch('/:memberId/:templateId/set-default', emailTemplateController.setDefaultTemplate);
router.post('/:memberId/:templateId/clone', emailTemplateController.cloneTemplate);
router.post('/:memberId/:templateId/placeholders', emailTemplateController.addPlaceholder);
router.delete('/:memberId/:templateId/placeholders', emailTemplateController.removePlaceholder);

module.exports = router;
