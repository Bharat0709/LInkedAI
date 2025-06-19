const randomString = (
  Date.now().toString(36) + Math.random().toString(36).slice(2)
).slice(0, 20);
const generateConnectionToken = (organizationId, memberId = randomString) => {
  return `${organizationId}-${memberId}-${randomString}`;
};

module.exports = { randomString, generateConnectionToken };
