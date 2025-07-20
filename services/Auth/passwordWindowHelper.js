// helpers/passwordWindowHelper.js
const { redisClient } = require('../../config/redis');

const WINDOW_KEY = orgId => `pwsetup:${orgId}`;
const WINDOW_TTL = 10 * 60;

exports.openPwSetupWindow = async orgId => {
  await redisClient.set(WINDOW_KEY(orgId), '1', 'EX', WINDOW_TTL);
};

exports.isPwSetupWindowOpen = async orgId => {
  const exists = await redisClient.exists(WINDOW_KEY(orgId));
  return exists === 1;
};

exports.closePwSetupWindow = async orgId => {
  await redisClient.del(WINDOW_KEY(orgId));
};
