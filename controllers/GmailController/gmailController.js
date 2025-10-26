// controllers/gmailController.js
const gmailService = require('../../services/Gmail/gmailService');
const catchAsync = require('../../utils/catchAsync');

exports.connectGmail = catchAsync(async (req, res, next) => {
  const userId = req.query.userId;
  const url = gmailService.generateAuthUrl(userId);
  res.json({ url });
});

exports.gmailCallback = catchAsync(async (req, res, next) => {
  try {
    const code = req.query.code;
    const userId = req.query.state;
    await gmailService.handleOAuthCallback(code, userId);
    res.redirect(`${process.env.CLIENT_URL}/dashboard/settings?gmailConnected=true`);
  } catch (err) {
    next(err);
  }
});

exports.sendGmail = catchAsync(async (req, res, next) => {
  const userId = req.params.memberId;
  const orgId = req.organization.id;
  try {
    const { to, subject, body, postId } = req.body;
    await gmailService.sendMail(userId, orgId, to, subject, body, postId);
    return res.status(200).json({ message: 'Email sent successfully ✅' });
  } catch (error) {
    next(error);
  }
});


exports.disconnectGmail = catchAsync(async (req, res, next) => {
  const userId = req.params.memberId;
  const organizationId = req.organization.id;

  try {
    await gmailService.disconnectGmail( organizationId , userId) ;
    return res.status(200).json({ message: 'Gmail disconnected successfully ✅' });
  } catch (error) {
    next(error);
  }
});
