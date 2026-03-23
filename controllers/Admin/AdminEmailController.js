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

  const emailPromises = members.map(member =>
    adminEmailService.send3_0UpdateEmail(member).catch(err => {
      console.error(`Failed to send email to ${member.email}:`, err.message);
      return null;
    })
  );

  await Promise.allSettled(emailPromises);

  res.status(200).json({
    success: true,
    message: `Update emails sent to ${members.length} members.`,
  });
});
