const creditExpiryService = require('../../../services/CreditsExpiry/CreditsExpiry');
const appError = require('../../../utils/appError');

const expireCredits = async (req, res) => {
  try {
    const password = req.body.password;
    const queryPassword = req.query.password;

    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    if (!password || password !== ADMIN_PASSWORD || (queryPassword && queryPassword !== ADMIN_PASSWORD)) {
      return new appError('Unauthorized: Invalid Admin Details', 401);
    }

    const result = await creditExpiryService.processExpiredCredits();

    return res.status(200).json({
      success: true,
      message: 'Credit expiry process completed',
      data: result,
    });
  } catch (error) {
    console.error('Error in expireCredits controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process expired credits',
      error: error.message,
    });
  }
};

const getExpiryStats = async (req, res) => {
  try {
    const stats = await creditExpiryService.getExpiryStats();

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error in getExpiryStats controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch expiry stats',
      error: error.message,
    });
  }
};

const sendExpiryNotifications = async (req, res) => {
  try {
    const { daysBeforeExpiry = 3 } = req.body;

    const result = await creditExpiryService.sendExpiryNotifications(daysBeforeExpiry);

    return res.status(200).json({
      success: true,
      message: 'Expiry notifications sent',
      data: result,
    });
  } catch (error) {
    console.error('Error in sendExpiryNotifications controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send expiry notifications',
      error: error.message,
    });
  }
};

module.exports = {
  expireCredits,
  getExpiryStats,
  sendExpiryNotifications,
};
