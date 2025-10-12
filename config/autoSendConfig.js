const axios = require("axios");
const fs = require("fs");
require("dotenv").config();

const sendAutoSendEmail = async (to, subject, html, attachments = []) => {
  try {
    // Prepare email data
    const emailData = {
      to: { email: to },
      from: { email: process.env.AUTOSEND_FROM_EMAIL, name: process.env.AUTOSEND_FROM_NAME || "EngageGPT" },
      subject,
      html,
    };

    // Attachments (AutoSend currently supports base64 or URLs, not raw file upload)
    if (attachments.length > 0) {
      emailData.attachments = attachments.map((file) => {
        const fileBuffer = fs.readFileSync(file.path);
        return {
          filename: file.filename || "attachment",
          content: fileBuffer.toString("base64"),
          contentType: file.contentType || "application/octet-stream",
        };
      });
    }

    // Send request
    const response = await axios.post(
      "https://api.autosend.com/v1/mails/send",
      emailData,
      {
        headers: {
          Authorization: `Bearer ${process.env.AUTOSEND_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

module.exports = sendAutoSendEmail;