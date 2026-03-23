const organizationRepository = require('../../repositories/organizationRepository');
const memberRepository = require('../../repositories/memberRepository');
const adminEmailService = require('../../admin/email/admin');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');

exports.sendUpdateEmailToAll = catchAsync(async (req, res, next) => {
  const { password } = req.params;

  // Basic security check matching existing admin routes
  if (password !== process.env.ADMIN_PASSWORD) {
    return next(new AppError('Invalid admin password', 401));
  }

  const members = await memberRepository.findAll();

  if (!members || members.length === 0) {
    return res.status(200).json({
      success: true,
      message: 'No active memebrs found to send emails to.',
    });
  }

  res.status(200).json({
    success: true,
    message: `Started sending update emails to ${members.length} members at 30-second intervals.`,
  });

  // Process emails in the background to prevent request timeout
  (async () => {
    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      try {
        await adminEmailService.send3_0UpdateEmail(member);
        console.log(`[${i + 1}/${members.length}] Sent update email to ${member.email}`);
      } catch (err) {
        console.error(`[${i + 1}/${members.length}] Failed to send email to ${member.email}:`, err.message);
      }
      
      if (i < members.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds interval
      }
    }
    console.log('Finished sending all update emails.');
  })();
});
