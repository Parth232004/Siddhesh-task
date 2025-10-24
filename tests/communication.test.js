const { EventEmitter } = require('events');
const communicationController = require('../controllers/communicationController');
const karmaTracker = require('../services/karmaTracker');
const InputValidator = require('../utils/inputValidator');

// Mock services
jest.mock('../services/emailService');
jest.mock('../services/whatsappService');
jest.mock('../services/telegramService');
jest.mock('../services/smsService');
jest.mock('../services/karmaTracker');

describe('Communication Controller Tests', () => {
  let eventEmitter;
  let controller;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    eventEmitter = new EventEmitter();
    controller = communicationController(eventEmitter);

    mockReq = {
      body: {}
    };

    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    // Mock karma tracker
    karmaTracker.logKarmaEvent = jest.fn().mockResolvedValue({ success: true });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Email Communication', () => {
    test('should send email successfully and log karma event', async () => {
      const emailService = require('../services/emailService');
      emailService.sendEmail = jest.fn().mockResolvedValue({ messageId: 'email-123', success: true });

      mockReq.body = {
        to: 'test@example.com',
        subject: 'Order Update',
        body: '<h1>Your order has been updated</h1>',
        type: 'transactional',
        userId: 'user-123'
      };

      const router = controller;
      // Simulate POST /email route
      const routeHandler = router.stack.find(layer =>
        layer.route && layer.route.path === '/email' && layer.route.methods.post
      ).route.stack[0].handle;

      await routeHandler(mockReq, mockRes);

      expect(emailService.sendEmail).toHaveBeenCalledWith(
        'test@example.com',
        'Order Update',
        '<h1>Your order has been updated</h1>',
        'transactional'
      );
      expect(karmaTracker.logKarmaEvent).toHaveBeenCalledWith({
        userId: 'user-123',
        channel: 'email',
        type: 'transactional',
        messageType: 'Order Update',
        success: true
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        messageId: 'email-123'
      });
    });

    test('should handle email sending failure', async () => {
      const emailService = require('../services/emailService');
      emailService.sendEmail = jest.fn().mockRejectedValue(new Error('SMTP Error'));

      mockReq.body = {
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test body',
        userId: 'user-123'
      };

      const router = controller;
      const routeHandler = router.stack.find(layer =>
        layer.route && layer.route.path === '/email' && layer.route.methods.post
      ).route.stack[0].handle;

      await routeHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'SMTP Error'
      });
    });

    test('should handle invalid email validation', async () => {
      mockReq.body = {
        to: 'invalid-email',
        subject: 'Test',
        body: 'Test body',
        userId: 'user-123'
      };

      const router = controller;
      const routeHandler = router.stack.find(layer =>
        layer.route && layer.route.path === '/email' && layer.route.methods.post
      ).route.stack[0].handle;

      await routeHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid recipient email format'
      });
    });

    test('should handle message too long for SMS', async () => {
      const longMessage = 'a'.repeat(161); // SMS limit is 160 characters
      mockReq.body = {
        to: '+1234567890',
        message: longMessage,
        userId: 'user-456'
      };

      const router = controller;
      const routeHandler = router.stack.find(layer =>
        layer.route && layer.route.path === '/sms' && layer.route.methods.post
      ).route.stack[0].handle;

      await routeHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Message must not exceed 160 characters'
      });
    });

    test('should handle service timeout', async () => {
      const emailService = require('../services/emailService');
      emailService.sendEmail = jest.fn().mockRejectedValue(new Error('Request timeout'));

      mockReq.body = {
        to: 'test@example.com',
        subject: 'Test',
        body: 'Test body',
        userId: 'user-123'
      };

      const router = controller;
      const routeHandler = router.stack.find(layer =>
        layer.route && layer.route.path === '/email' && layer.route.methods.post
      ).route.stack[0].handle;

      await routeHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Request timeout'
      });
    });

    test('should handle missing required fields', async () => {
      mockReq.body = {
        subject: 'Test'
        // missing to, body, userId
      };

      const router = controller;
      const routeHandler = router.stack.find(layer =>
        layer.route && layer.route.path === '/email' && layer.route.methods.post
      ).route.stack[0].handle;

      await routeHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Recipient email (to) is required'
      });
    });
  });

  describe('WhatsApp Communication', () => {
    test('should send WhatsApp message and log karma for delivery alert', async () => {
      const whatsappService = require('../services/whatsappService');
      whatsappService.sendMessage = jest.fn().mockResolvedValue({ messageId: 'wa-123', success: true });

      mockReq.body = {
        to: '+1234567890',
        message: 'Your delivery is on the way!',
        type: 'delivery',
        userId: 'user-456'
      };

      const router = controller;
      const routeHandler = router.stack.find(layer =>
        layer.route && layer.route.path === '/whatsapp' && layer.route.methods.post
      ).route.stack[0].handle;

      await routeHandler(mockReq, mockRes);

      expect(whatsappService.sendMessage).toHaveBeenCalledWith(
        '+1234567890',
        'Your delivery is on the way!',
        'delivery'
      );
      expect(karmaTracker.logKarmaEvent).toHaveBeenCalledWith({
        userId: 'user-456',
        channel: 'whatsapp',
        type: 'delivery',
        messageType: 'Delivery Alert',
        success: true
      });
    });
  });

  describe('Telegram Communication', () => {
    test('should send Telegram notification and log karma', async () => {
      const telegramService = require('../services/telegramService');
      telegramService.sendMessage = jest.fn().mockResolvedValue({ messageId: 'tg-123', success: true });

      mockReq.body = {
        chatId: '123456789',
        message: 'Quick notification: Order processed',
        type: 'notification',
        userId: 'user-789'
      };

      const router = controller;
      const routeHandler = router.stack.find(layer =>
        layer.route && layer.route.path === '/telegram' && layer.route.methods.post
      ).route.stack[0].handle;

      await routeHandler(mockReq, mockRes);

      expect(telegramService.sendMessage).toHaveBeenCalledWith(
        '123456789',
        'Quick notification: Order processed',
        'notification'
      );
      expect(karmaTracker.logKarmaEvent).toHaveBeenCalledWith({
        userId: 'user-789',
        channel: 'telegram',
        type: 'notification',
        messageType: 'Quick Notification',
        success: true
      });
    });
  });

  describe('SMS Communication', () => {
    test('should send SMS and log karma for urgent update', async () => {
      const smsService = require('../services/smsService');
      smsService.sendSMS = jest.fn().mockResolvedValue({ messageId: 'sms-123', success: true });

      mockReq.body = {
        to: '+1234567890',
        message: 'Urgent: Delivery delayed due to weather',
        type: 'urgent',
        userId: 'user-101'
      };

      const router = controller;
      const routeHandler = router.stack.find(layer =>
        layer.route && layer.route.path === '/sms' && layer.route.methods.post
      ).route.stack[0].handle;

      await routeHandler(mockReq, mockRes);

      expect(smsService.sendSMS).toHaveBeenCalledWith(
        '+1234567890',
        'Urgent: Delivery delayed due to weather',
        'urgent'
      );
      expect(karmaTracker.logKarmaEvent).toHaveBeenCalledWith({
        userId: 'user-101',
        channel: 'sms',
        type: 'urgent',
        messageType: 'Urgent Update',
        success: true
      });
    });
  });

  describe('Unified Send Endpoint', () => {
    test('should route to appropriate service based on channel', async () => {
      const emailService = require('../services/emailService');
      emailService.sendEmail = jest.fn().mockResolvedValue({ messageId: 'email-456', success: true });

      mockReq.body = {
        channel: 'email',
        to: 'test@example.com',
        subject: 'Report',
        body: 'Monthly report attached',
        type: 'report',
        userId: 'user-202'
      };

      const router = controller;
      const routeHandler = router.stack.find(layer =>
        layer.route && layer.route.path === '/send' && layer.route.methods.post
      ).route.stack[0].handle;

      await routeHandler(mockReq, mockRes);

      expect(emailService.sendEmail).toHaveBeenCalled();
      expect(karmaTracker.logKarmaEvent).toHaveBeenCalledWith({
        userId: 'user-202',
        channel: 'email',
        type: 'report',
        messageType: 'Report',
        success: true
      });
    });

    test('should handle invalid channel', async () => {
      mockReq.body = {
        channel: 'invalid',
        userId: 'user-303'
      };

      const router = controller;
      const routeHandler = router.stack.find(layer =>
        layer.route && layer.route.path === '/send' && layer.route.methods.post
      ).route.stack[0].handle;

      await routeHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid channel. Must be one of: email, whatsapp, telegram, sms'
      });
    });

    test('should handle invalid phone number in WhatsApp', async () => {
      mockReq.body = {
        to: 'invalid-phone',
        message: 'Test message',
        userId: 'user-456'
      };

      const router = controller;
      const routeHandler = router.stack.find(layer =>
        layer.route && layer.route.path === '/whatsapp' && layer.route.methods.post
      ).route.stack[0].handle;

      await routeHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid phone number format. Use international format (e.g., +1234567890)'
      });
    });

    test('should handle invalid chat ID in Telegram', async () => {
      mockReq.body = {
        chatId: 'not-a-number',
        message: 'Test message',
        userId: 'user-789'
      };

      const router = controller;
      const routeHandler = router.stack.find(layer =>
        layer.route && layer.route.path === '/telegram' && layer.route.methods.post
      ).route.stack[0].handle;

      await routeHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Chat ID must be numeric'
      });
    });
  });
});