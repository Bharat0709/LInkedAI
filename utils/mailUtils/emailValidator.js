class EmailValidator {
  static isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  static validateEmailData(data, requiredFields = []) {
    const errors = [];

    // Check required fields
    for (const field of requiredFields) {
      if (!data[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Validate email fields
    const emailFields = ['email', 'MemberEmail'];
    for (const field of emailFields) {
      if (data[field] && !this.isValidEmail(data[field])) {
        errors.push(`Invalid email format: ${field}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static sanitizeEmailData(data) {
    const sanitized = { ...data };

    // Trim email fields
    const emailFields = ['email', 'MemberEmail'];
    for (const field of emailFields) {
      if (sanitized[field]) {
        sanitized[field] = sanitized[field].trim().toLowerCase();
      }
    }

    // Trim string fields
    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === 'string') {
        sanitized[key] = value.trim();
      }
    }

    return sanitized;
  }
}

module.exports = EmailValidator;
