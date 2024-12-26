const randomString =
  Date.now().toString(36) + Math.random().toString(36).substring(2);
const generateConnectionToken = (organizationId, memberId = randomString) => {
  return `${organizationId}-${memberId}-${randomString}`;
};

module.exports = { randomString, generateConnectionToken };
