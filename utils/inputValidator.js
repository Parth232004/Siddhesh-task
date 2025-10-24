class InputValidator {
  // Email validation
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Phone number validation (basic international format)
  static validatePhoneNumber(phone) {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  }

  // Required field validation
  static validateRequired(value, fieldName) {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      throw new Error(`${fieldName} is required`);
    }
    return true;
  }

  // Length validation
  static validateLength(value, fieldName, min = 1, max = 1000) {
    if (typeof value !== 'string') return true; // Skip for non-strings
    if (value.length < min) {
      throw new Error(`${fieldName} must be at least ${min} characters long`);
    }
    if (value.length > max) {
      throw new Error(`${fieldName} must not exceed ${max} characters`);
    }
    return true;
  }

  // Validate email payload
  static validateEmailPayload(payload) {
    this.validateRequired(payload.to, 'Recipient email (to)');
    this.validateRequired(payload.subject, 'Email subject');
    this.validateRequired(payload.body, 'Email body');
    this.validateRequired(payload.userId, 'User ID');

    if (!this.validateEmail(payload.to)) {
      throw new Error('Invalid recipient email format');
    }

    this.validateLength(payload.subject, 'Email subject', 1, 200);
    this.validateLength(payload.body, 'Email body', 1, 10000);

    return true;
  }

  // Validate WhatsApp payload
  static validateWhatsAppPayload(payload) {
    this.validateRequired(payload.to, 'Recipient phone number (to)');
    this.validateRequired(payload.message, 'Message content');
    this.validateRequired(payload.userId, 'User ID');

    if (!this.validatePhoneNumber(payload.to)) {
      throw new Error('Invalid phone number format. Use international format (e.g., +1234567890)');
    }

    this.validateLength(payload.message, 'Message', 1, 4096); // WhatsApp limit

    return true;
  }

  // Validate Telegram payload
  static validateTelegramPayload(payload) {
    this.validateRequired(payload.chatId, 'Chat ID');
    this.validateRequired(payload.message, 'Message content');
    this.validateRequired(payload.userId, 'User ID');

    // Chat ID should be numeric
    if (isNaN(payload.chatId)) {
      throw new Error('Chat ID must be numeric');
    }

    this.validateLength(payload.message, 'Message', 1, 4096); // Telegram limit

    return true;
  }

  // Validate SMS payload
  static validateSMSPayload(payload) {
    this.validateRequired(payload.to, 'Recipient phone number (to)');
    this.validateRequired(payload.message, 'Message content');
    this.validateRequired(payload.userId, 'User ID');

    if (!this.validatePhoneNumber(payload.to)) {
      throw new Error('Invalid phone number format. Use international format (e.g., +1234567890)');
    }

    this.validateLength(payload.message, 'Message', 1, 160); // SMS limit

    return true;
  }

  // Validate unified send payload
  static validateUnifiedPayload(payload) {
    this.validateRequired(payload.channel, 'Communication channel');
    this.validateRequired(payload.userId, 'User ID');

    const validChannels = ['email', 'whatsapp', 'telegram', 'sms'];
    if (!validChannels.includes(payload.channel)) {
      throw new Error(`Invalid channel. Must be one of: ${validChannels.join(', ')}`);
    }

    // Validate channel-specific requirements
    switch (payload.channel) {
      case 'email':
        return this.validateEmailPayload(payload);
      case 'whatsapp':
        return this.validateWhatsAppPayload(payload);
      case 'telegram':
        return this.validateTelegramPayload(payload);
      case 'sms':
        return this.validateSMSPayload(payload);
      default:
        throw new Error('Unsupported channel validation');
    }
  }

  // Sanitize input (basic XSS prevention)
  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;

    return input
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // Validate and sanitize payload
  static validateAndSanitizePayload(channel, payload) {
    let cleanPayload = { ...payload };

    // Sanitize string fields
    Object.keys(cleanPayload).forEach(key => {
      if (typeof cleanPayload[key] === 'string') {
        cleanPayload[key] = this.sanitizeInput(cleanPayload[key]);
      }
    });

    // Validate based on channel
    switch (channel) {
      case 'email':
        this.validateEmailPayload(cleanPayload);
        break;
      case 'whatsapp':
        this.validateWhatsAppPayload(cleanPayload);
        break;
      case 'telegram':
        this.validateTelegramPayload(cleanPayload);
        break;
      case 'sms':
        this.validateSMSPayload(cleanPayload);
        break;
      case 'unified':
        this.validateUnifiedPayload(cleanPayload);
        break;
      default:
        throw new Error('Unknown validation channel');
    }

    return cleanPayload;
  }
}

module.exports = InputValidator;