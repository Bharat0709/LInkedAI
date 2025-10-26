// repositories/gmailRepository.js
const { updateById, getGmailTokensByUserId } = require('./memberRepository');
const { encodeToken, decodeToken } = require('../utils/tokenUtils');

const saveTokens = async (userId, tokens) => {
  const encryptedRefresh = encodeToken(tokens.refresh_token);
  await updateById(userId, {
    $set: {
      gmailTokens: {
        email: tokens.email,
        accessToken: tokens.access_token,
        refreshToken: encryptedRefresh,
        expiryDate: tokens.expiry_date,
      },
    },
  });
};

const getTokens = async userId => {
  const user = await getGmailTokensByUserId(userId);
  if (!user?.gmailTokens) return null;
  return {
    email: user.gmailTokens.email,
    accessToken: user.gmailTokens.accessToken,
    refreshToken: decodeToken(user.gmailTokens.refreshToken),
    expiryDate: user.gmailTokens.expiryDate,
  };
};

// ✅ Remove Gmail access + refresh tokens
const removeTokens = async userId => {
  return await updateById(
    userId,
    {
      $unset: {
        'gmailTokens.accessToken': '',
        'gmailTokens.refreshToken': '',
        'gmailTokens.expiryDate': '',
        'gmailTokens.email': '',
      },
    },
    { new: true }
  );
};

module.exports = { saveTokens, getTokens, removeTokens };
