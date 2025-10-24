const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.ZOHO_SMTP_HOST || 'smtp.zoho.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.ZOHO_EMAIL,
        pass: process.env.ZOHO_PASSWORD
      }
    });
  }

  async sendEmail(to, subject, body, type = 'transactional') {
    try {
      const mailOptions = {
        from: process.env.ZOHO_EMAIL,
        to: to,
        subject: subject,
        html: body,
        // Add headers for different types
        headers: {
          'X-Priority': type === 'report' ? '1' : '3',
          'X-Mailer': 'Logistics Manager Communication Service'
        }
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);

      return {
        messageId: info.messageId,
        success: true
      };
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new Error(`Email sending failed: ${error.message}`);
    }
  }

  // For Zoho Mail API integration (alternative method)
  async sendViaZohoAPI(to, subject, body, type = 'transactional') {
    const axios = require('axios');

    try {
      const response = await axios.post('https://mail.zoho.com/api/accounts/me/messages', {
        toRecipients: [{ address: to }],
        subject: subject,
        content: body,
        contentType: 'html'
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.ZOHO_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        messageId: response.data.messageId,
        success: true
      };
    } catch (error) {
      console.error('Zoho API email sending failed:', error);
      throw new Error(`Zoho API email sending failed: ${error.message}`);
    }
  }
}

module.exports = new EmailService();