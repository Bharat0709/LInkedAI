const express = require('express');
const contentCalendarController = require('../controllers/LinkedIn/contentCalendarController');
const integrationUtils = require('../utils/integrations');
const { verifyToken } = require('../middlewares/verifytoken');

const router = express.Router();

router.use(verifyToken);

router.get('/:memberId', contentCalendarController.getContentCalendar);
router.post('/:memberId', contentCalendarController.addContentCalendar);
router.put('/:memberId/:contentId', contentCalendarController.updateContentCalendar);
router.delete('/:memberId/:contentId', contentCalendarController.deleteContentCalendar);
router.post('/integrations/googleSheet', integrationUtils.fetchGoogleSheetData);

module.exports = router;
