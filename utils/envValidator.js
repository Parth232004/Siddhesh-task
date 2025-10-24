class EnvironmentValidator {
  constructor() {
    this.requiredVars = {
      // Server
      NODE_ENV: process.env.NODE_ENV,

      // Zoho Mail
      ZOHO_SMTP_HOST: process.env.ZOHO_SMTP_HOST,
      ZOHO_EMAIL: process.env.ZOHO_EMAIL,
      ZOHO_PASSWORD: process.env.ZOHO_PASSWORD,

      // WhatsApp
      WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
      WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,

      // Twilio
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
      TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,

      // Telegram
      TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,

      // SMS (at least one provider required)
      FAST2SMS_API_KEY: process.env.FAST2SMS_API_KEY,

      // Karma Tracker
      KARMA_TRACKER_BASE_URL: process.env.KARMA_TRACKER_BASE_URL,
      KARMA_TRACKER_API_KEY: process.env.KARMA_TRACKER_API_KEY
    };

    this.optionalVars = {
      TWILIO_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER,
      TWILIO_STATUS_CALLBACK_URL: process.env.TWILIO_STATUS_CALLBACK_URL,
      FAST2SMS_SENDER_ID: process.env.FAST2SMS_SENDER_ID,
      ZOHO_ACCESS_TOKEN: process.env.ZOHO_ACCESS_TOKEN,
      BHIV_CORE_API_URL: process.env.BHIV_CORE_API_URL,
      BHIV_CORE_API_KEY: process.env.BHIV_CORE_API_KEY
    };
  }

  validate() {
    const missing = [];
    const warnings = [];

    // Check required variables
    for (const [key, value] of Object.entries(this.requiredVars)) {
      if (!value || value.trim() === '') {
        missing.push(key);
      }
    }

    // Check for at least one SMS provider
    const hasTwilioSMS = this.requiredVars.TWILIO_ACCOUNT_SID && this.requiredVars.TWILIO_AUTH_TOKEN && this.requiredVars.TWILIO_PHONE_NUMBER;
    const hasFast2SMS = this.requiredVars.FAST2SMS_API_KEY;

    if (!hasTwilioSMS && !hasFast2SMS) {
      warnings.push('No SMS provider configured. At least one of Twilio or Fast2SMS must be set up.');
    }

    // Check for WhatsApp provider
    const hasWhatsAppCloud = this.requiredVars.WHATSAPP_PHONE_NUMBER_ID && this.requiredVars.WHATSAPP_ACCESS_TOKEN;
    const hasTwilioWhatsApp = this.optionalVars.TWILIO_WHATSAPP_NUMBER;

    if (!hasWhatsAppCloud && !hasTwilioWhatsApp) {
      warnings.push('No WhatsApp provider configured. At least one WhatsApp service must be set up.');
    }

    if (missing.length > 0) {
      const errorMessage = `Missing required environment variables:\n${missing.map(key => `  - ${key}`).join('\n')}\n\nPlease check your .env file and ensure all required variables are set.`;
      throw new Error(errorMessage);
    }

    if (warnings.length > 0) {
      console.warn('Environment Configuration Warnings:');
      warnings.forEach(warning => console.warn(`  ⚠️  ${warning}`));
    }

    console.log('✅ Environment validation passed');
    return true;
  }

  getMissingVars() {
    const missing = [];
    for (const [key, value] of Object.entries(this.requiredVars)) {
      if (!value || value.trim() === '') {
        missing.push(key);
      }
    }
    return missing;
  }

  getConfigSummary() {
    const summary = {
      server: {
        port: this.requiredVars.PORT || '3000',
        environment: this.requiredVars.NODE_ENV || 'development'
      },
      services: {
        email: !!this.requiredVars.ZOHO_EMAIL,
        whatsapp: !!(this.requiredVars.WHATSAPP_ACCESS_TOKEN || this.optionalVars.TWILIO_WHATSAPP_NUMBER),
        telegram: !!this.requiredVars.TELEGRAM_BOT_TOKEN,
        sms: !!(this.requiredVars.TWILIO_PHONE_NUMBER || this.requiredVars.FAST2SMS_API_KEY)
      },
      karmaTracker: !!this.requiredVars.KARMA_TRACKER_API_KEY
    };

    return summary;
  }
}

module.exports = new EnvironmentValidator();