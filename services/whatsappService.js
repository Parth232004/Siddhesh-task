const axios = require('axios');

class WhatsAppService {
  constructor() {
    this.baseURL = 'https://graph.facebook.com/v18.0';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  }

  async sendMessage(to, message, type = 'delivery') {
    try {
      // Remove any non-numeric characters from phone number
      const cleanTo = to.replace(/\D/g, '');

      const payload = {
        messaging_product: 'whatsapp',
        to: cleanTo,
        type: 'text',
        text: {
          body: message
        }
      };

      const response = await axios.post(
        `${this.baseURL}/${this.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('WhatsApp message sent successfully:', response.data.messages[0].id);

      return {
        messageId: response.data.messages[0].id,
        success: true
      };
    } catch (error) {
      console.error('WhatsApp message sending failed:', error.response?.data || error.message);
      throw new Error(`WhatsApp message sending failed: ${error.message}`);
    }
  }

  // Alternative Twilio WhatsApp integration
  async sendViaTwilio(to, message, type = 'delivery') {
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    try {
      const messageResponse = await client.messages.create({
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${to}`,
        body: message
      });

      console.log('Twilio WhatsApp message sent successfully:', messageResponse.sid);

      return {
        messageId: messageResponse.sid,
        success: true
      };
    } catch (error) {
      console.error('Twilio WhatsApp message sending failed:', error);
      throw new Error(`Twilio WhatsApp message sending failed: ${error.message}`);
    }
  }

  // Send template message for delivery updates
  async sendTemplateMessage(to, templateName, parameters = []) {
    try {
      const cleanTo = to.replace(/\D/g, '');

      const payload = {
        messaging_product: 'whatsapp',
        to: cleanTo,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en' },
          components: [{
            type: 'body',
            parameters: parameters.map(param => ({ type: 'text', text: param }))
          }]
        }
      };

      const response = await axios.post(
        `${this.baseURL}/${this.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        messageId: response.data.messages[0].id,
        success: true
      };
    } catch (error) {
      console.error('WhatsApp template message sending failed:', error.response?.data || error.message);
      throw new Error(`WhatsApp template message sending failed: ${error.message}`);
    }
  }
}

module.exports = new WhatsAppService();