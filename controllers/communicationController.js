const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const whatsappService = require('../services/whatsappService');
const telegramService = require('../services/telegramService');
const smsService = require('../services/smsService');

module.exports = (eventEmitter) => {
  // Send email
  router.post('/email', async (req, res) => {
    try {
      const { to, subject, body, type = 'transactional' } = req.body;
      const result = await emailService.sendEmail(to, subject, body, type);

      // Emit karma event
      eventEmitter.emit('communicationSent', {
        userId: req.body.userId,
        channel: 'email',
        type: type,
        messageType: subject.includes('Order') ? 'Order Update' : 'Report',
        success: true
      });

      res.json({ success: true, messageId: result.messageId });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Send WhatsApp message
  router.post('/whatsapp', async (req, res) => {
    try {
      const { to, message, type = 'delivery' } = req.body;
      const result = await whatsappService.sendMessage(to, message, type);

      eventEmitter.emit('communicationSent', {
        userId: req.body.userId,
        channel: 'whatsapp',
        type: type,
        messageType: type === 'delivery' ? 'Delivery Alert' : 'CRM Alert',
        success: true
      });

      res.json({ success: true, messageId: result.messageId });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Send Telegram message
  router.post('/telegram', async (req, res) => {
    try {
      const { chatId, message, type = 'notification' } = req.body;
      const result = await telegramService.sendMessage(chatId, message, type);

      eventEmitter.emit('communicationSent', {
        userId: req.body.userId,
        channel: 'telegram',
        type: type,
        messageType: type === 'notification' ? 'Quick Notification' : 'Command Response',
        success: true
      });

      res.json({ success: true, messageId: result.messageId });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Send SMS
  router.post('/sms', async (req, res) => {
    try {
      const { to, message, type = 'fallback' } = req.body;
      const result = await smsService.sendSMS(to, message, type);

      eventEmitter.emit('communicationSent', {
        userId: req.body.userId,
        channel: 'sms',
        type: type,
        messageType: type === 'fallback' ? 'Fallback Update' : 'Urgent Update',
        success: true
      });

      res.json({ success: true, messageId: result.messageId });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Unified send endpoint
  router.post('/send', async (req, res) => {
    try {
      const { channel, ...messageData } = req.body;
      let result;

      switch (channel) {
        case 'email':
          result = await emailService.sendEmail(messageData.to, messageData.subject, messageData.body, messageData.type);
          break;
        case 'whatsapp':
          result = await whatsappService.sendMessage(messageData.to, messageData.message, messageData.type);
          break;
        case 'telegram':
          result = await telegramService.sendMessage(messageData.chatId, messageData.message, messageData.type);
          break;
        case 'sms':
          result = await smsService.sendSMS(messageData.to, messageData.message, messageData.type);
          break;
        default:
          throw new Error('Invalid channel specified');
      }

      eventEmitter.emit('communicationSent', {
        userId: messageData.userId,
        channel: channel,
        type: messageData.type || 'general',
        messageType: messageData.messageType || 'General Message',
        success: true
      });

      res.json({ success: true, channel, messageId: result.messageId });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  return router;
};