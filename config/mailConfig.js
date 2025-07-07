const axios = require('axios');
const FormData = require('form-data');
const dotenv = require('dotenv');
dotenv.config();

const sendFrostmailEmail = async (to, subject, htmlContent) => {
  const form = new FormData();
  form.append('recipientEmail', to);
  form.append('subject', subject);
  form.append('templateData', htmlContent);
  form.append('templateFormat', 'html');

  try {
    const response = await axios.post(
      `${process.env.EMAIL_URL_THIRD_PARTY}`,
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${process.env.FROSTMAIL_AUTH_TOKEN}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('❌ Frostmail Error:', error.response?.data || error.message);
    throw error;
  }
};

module.exports = sendFrostmailEmail;
