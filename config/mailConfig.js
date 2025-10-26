const dotenv = require('dotenv');
dotenv.config();

const sendFrostmailEmail = async (
  to,
  subject,
  htmlContent,
  attachments = []
) => {
  const FormData = require('form-data');
  const axios = require('axios');
  const fs = require('fs');

  const form = new FormData();
  form.append('recipientEmail', to);
  form.append('subject', subject);
  form.append('templateData', htmlContent);
  form.append('templateFormat', 'html');

  // Add attachments if provided
  if (attachments && attachments.length > 0) {
    attachments.forEach((attachment, index) => {
      if (attachment.path && fs.existsSync(attachment.path)) {
        // If attachment has a file path, read the file
        form.append(
          `attachments[${index}]`,
          fs.createReadStream(attachment.path),
          {
            filename: attachment.filename || `attachment_${index}`,
            contentType: attachment.contentType || 'application/octet-stream',
          }
        );
      } else if (attachment.buffer) {
        // If attachment has buffer data
        form.append(`attachments[${index}]`, attachment.buffer, {
          filename: attachment.filename || `attachment_${index}`,
          contentType: attachment.contentType || 'application/octet-stream',
        });
      }
    });
  }

  try {
    const response = await axios.post(`${process.env.EMAIL_URL_THIRD_PARTY}`, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${process.env.FROSTMAIL_AUTH_TOKEN}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('❌ Frostmail Error:', error.response?.data || error.message);
    throw error;
  }
};
module.exports = sendFrostmailEmail;