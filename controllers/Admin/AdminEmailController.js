const organizationRepository = require('../../repositories/organizationRepository');
const adminEmailService = require('../../admin/email/admin');
const catchAsync = require('../../utils/catchAsync');
const AppError = require('../../utils/appError');

exports.sendUpdateEmailToAll = catchAsync(async (req, res, next) => {
  const { password } = req.params;

  // Basic security check matching existing admin routes
  if (password !== process.env.ADMIN_PASSWORD) {
    return next(new AppError('Invalid admin password', 401));
  }

  const organizations = await organizationRepository.findAll();

  if (!organizations || organizations.length === 0) {
    return res.status(200).json({
      success: true,
      message: 'No active organizations found to send emails to.',
    });
  }

  // Send emails asynchronously
  // We use Promise.allSettled to ensure we try to send to everyone even if some fail
  const emailPromises = organizations.map(org =>
    adminEmailService.send3_0UpdateEmail(org).catch(err => {
      console.error(`Failed to send email to ${org.email}:`, err.message);
      return null;
    })
  );

  await Promise.allSettled(emailPromises);

  res.status(200).json({
    success: true,
    message: `Update emails sent to ${organizations.length} organizations.`,
  });
});
