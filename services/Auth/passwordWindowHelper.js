// helpers/passwordWindowHelper.js
const { redisClient } = require('../../config/redis');

const WINDOW_KEY = orgId => `pwsetup:${orgId}`;
const DEFAULT_WINDOW_DURATION_SECONDS = 10 * 60; // 10 minutes

/**
 * Opens a password setup window for the given organization
 * TTL is set based on DB expiry (passed from caller)
 */
exports.openPwSetupWindow = async (orgId, ttlSeconds = DEFAULT_WINDOW_DURATION_SECONDS) => {
  try {
    console.log(`Password setup window opened for org ${orgId} - expires in ${ttlSeconds} seconds`);
    await redisClient.set(WINDOW_KEY(orgId), '1', 'EX', ttlSeconds);
  } catch (error) {
    console.error('Error opening password setup window:', error);
    throw error;
  }
};

/**
 * Checks if the password setup window is still open
 */
exports.isPwSetupWindowOpen = async orgId => {
  try {
    const exists = await redisClient.exists(WINDOW_KEY(orgId));
    console.log(`Password setup window check for org ${orgId}: ${exists === 1 ? 'OPEN' : 'CLOSED'}`);
    return exists === 1;
  } catch (error) {
    console.error('Error checking password setup window:', error);
    return false;
  }
};

/**
 * Closes the password setup window
 */
exports.closePwSetupWindow = async orgId => {
  try {
    await redisClient.del(WINDOW_KEY(orgId));
    console.log(`Password setup window closed for org ${orgId}`);
  } catch (error) {
    console.error('Error closing password setup window:', error);
  }
};

/**
 * Gets the remaining TTL for the password setup window
 */
exports.getWindowRemainingTime = async orgId => {
  try {
    const ttl = await redisClient.ttl(WINDOW_KEY(orgId));
    if (ttl < 0) return null;
    return ttl;
  } catch (error) {
    console.error('Error getting window remaining time:', error);
    return null;
  }
};

/**
 * Extends the password setup window
 */
exports.extendPwSetupWindow = async (orgId, additionalSeconds = 300) => {
  try {
    const currentTtl = await redisClient.ttl(WINDOW_KEY(orgId));
    if (currentTtl > 0) {
      const newTtl = currentTtl + additionalSeconds;
      await redisClient.expire(WINDOW_KEY(orgId), newTtl);
      console.log(`Password setup window extended for org ${orgId} by ${additionalSeconds}s`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error extending password setup window:', error);
    return false;
  }
};
