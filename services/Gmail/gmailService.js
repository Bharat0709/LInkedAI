// services/gmailService.js
const oauth2Client = require('../../config/gmailConfig');
const organizationRepository = require('../../repositories/organizationRepository');
const memberRepository = require('../../repositories/memberRepository');
const { saveTokens, getTokens, removeTokens } = require('../../repositories/gmailRepository');
const { google } = require('googleapis');
const { updateStatus } = require('../SavedPost/savedPostService');
const AppError = require('../../utils/appError');

const GMAIL_SCOPES = ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/userinfo.email'];

const generateAuthUrl = userId => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: GMAIL_SCOPES,
    state: userId.toString(),
  });
  return url;
};

const handleOAuthCallback = async (code, userId) => {
  // 1. Get Access + Refresh Token
  const { tokens } = await oauth2Client.getToken(code);

  // 2. Set tokens for the current OAuth client
  oauth2Client.setCredentials(tokens);

  // 3. Fetch user email using Google OAuth2 API
  const oauth2 = google.oauth2({
    auth: oauth2Client,
    version: 'v2',
  });

  const { data } = await oauth2.userinfo.get();
  const userEmail = data.email;

  // 4. ✅ Save tokens and email to DB
  await saveTokens(userId, {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date,
    email: userEmail,
  });

  return { email: userEmail };
};

const sendMail = async (userId, organizationId, to, subject, html, postId) => {
  const tokens = await getTokens(userId);
  if (!tokens) throw new Error('Gmail not connected');

  const existingOrganization = await organizationRepository.findById(organizationId);
  if (!existingOrganization) {
    throw new AppError('Organization not found', 404);
  }

  const existingMember = await memberRepository.findById(userId);
  if (!existingMember || existingMember.organizationId.toString() !== organizationId.toString()) {
    throw new AppError('Member not found or does not belong to the organization', 404);
  }

  const client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);

  client.setCredentials({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    expiry_date: tokens.expiryDate,
  });

  // Auto refresh expired token
  if (Date.now() >= tokens.expiryDate) {
    const newTokens = await client.refreshAccessToken();
    await saveTokens(userId, newTokens.credentials);
  }

  const gmail = google.gmail({ version: 'v1', auth: client });
  const rawMessage = Buffer.from(`From: me\r\nTo: ${to}\r\nSubject: ${subject}\r\n` + `MIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n${html}`)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: rawMessage },
  });

  if (postId) {
    await updateStatus(postId, 'contacted', existingOrganization);
  }
};

const disconnectGmail = async (organizationId, userId) => {
  // Check if member exists

  const organization = await organizationRepository.findById(organizationId);
  if (!organization) {
    throw new AppError('Organization not found', 404);
  }

  // Find member and verify they belong to organization
  const member = await memberRepository.findByIdAndOrg(userId, organizationId);
  if (!member) {
    throw new AppError('Member not found or does not belong to the organization', 404);
  }

  // Remove Gmail tokens from DB
  await removeTokens(userId);

  return { message: 'Gmail disconnected successfully' };
};

module.exports = { generateAuthUrl, handleOAuthCallback, sendMail, disconnectGmail };
