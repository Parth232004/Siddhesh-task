const karmaTracker = require('../services/karmaTracker');

// Mock axios
jest.mock('axios');
const axios = require('axios');

// Mock environment variables for tests
process.env.KARMA_TRACKER_BASE_URL = 'https://karma-tracker-api.example.com';
process.env.KARMA_TRACKER_API_KEY = 'test-api-key';

describe('Karma Tracker Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logKarmaEvent', () => {
    test('should log successful order update event', async () => {
      const mockResponse = { data: { id: 'karma-123', success: true } };
      axios.post.mockResolvedValue(mockResponse);

      const eventData = {
        userId: 'user-123',
        channel: 'email',
        type: 'transactional',
        messageType: 'Order Update',
        success: true
      };

      const result = await karmaTracker.logKarmaEvent(eventData);

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/karma/events'),
        expect.objectContaining({
          userId: 'user-123',
          karmaType: 'SEVA',
          karmaGain: 2,
          karmaLoss: 0,
          activity: 'Communication via email: Order Update'
        }),
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse.data);
    });

    test('should log failed communication event with karma loss', async () => {
      const mockResponse = { data: { id: 'karma-456', success: true } };
      axios.post.mockResolvedValue(mockResponse);

      const eventData = {
        userId: 'user-456',
        channel: 'whatsapp',
        type: 'delivery',
        messageType: 'Delivery Alert',
        success: false
      };

      const result = await karmaTracker.logKarmaEvent(eventData);

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/karma/events'),
        expect.objectContaining({
          userId: 'user-456',
          karmaType: 'KARMA_LOSS',
          karmaGain: 0,
          karmaLoss: -1,
          activity: 'Communication via whatsapp: Delivery Alert'
        }),
        expect.any(Object)
      );
    });

    test('should handle API errors', async () => {
      const error = new Error('API Error');
      error.response = { data: 'Server error' };
      axios.post.mockRejectedValue(error);

      const eventData = {
        userId: 'user-789',
        channel: 'sms',
        type: 'urgent',
        messageType: 'Urgent Update',
        success: true
      };

      await expect(karmaTracker.logKarmaEvent(eventData)).rejects.toThrow('Karma event logging failed: API Error');
    });
  });

  describe('karmaEventPost (Siddhesh integration)', () => {
    test('should post karma event using Siddhesh format', async () => {
      const mockResponse = { data: { event_id: 'event-123', karma_points: 3 } };
      axios.post.mockResolvedValue(mockResponse);

      const eventData = {
        userId: 'user-321',
        channel: 'telegram',
        type: 'notification',
        messageType: 'Quick Notification',
        success: true
      };

      const result = await karmaTracker.karmaEventPost(eventData);

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/karma/events'),
        expect.objectContaining({
          user_id: 'user-321',
          event_type: 'communication',
          karma_points: 1, // Quick Notification = 1 point
          description: 'Communication event: Quick Notification via telegram'
        }),
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse.data);
    });

    test('should assign karma loss for failed events', async () => {
      const mockResponse = { data: { event_id: 'event-456' } };
      axios.post.mockResolvedValue(mockResponse);

      const eventData = {
        userId: 'user-654',
        channel: 'email',
        type: 'report',
        messageType: 'Report',
        success: false
      };

      const result = await karmaTracker.karmaEventPost(eventData);

      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/karma/events'),
        expect.objectContaining({
          user_id: 'user-654',
          karma_points: -1, // Failed event = -1 point
          description: 'Communication event: Report via email'
        }),
        expect.any(Object)
      );
    });
  });

  describe('calculateKarmaPoints', () => {
    test('should return correct karma points for different message types', () => {
      expect(karmaTracker.calculateKarmaPoints({ messageType: 'Order Update' })).toBe(2);
      expect(karmaTracker.calculateKarmaPoints({ messageType: 'Delivery Alert' })).toBe(3);
      expect(karmaTracker.calculateKarmaPoints({ messageType: 'CRM Alert' })).toBe(1);
      expect(karmaTracker.calculateKarmaPoints({ messageType: 'Quick Notification' })).toBe(1);
      expect(karmaTracker.calculateKarmaPoints({ messageType: 'Command Response' })).toBe(2);
      expect(karmaTracker.calculateKarmaPoints({ messageType: 'Fallback Update' })).toBe(1);
      expect(karmaTracker.calculateKarmaPoints({ messageType: 'Urgent Update' })).toBe(4);
      expect(karmaTracker.calculateKarmaPoints({ messageType: 'Report' })).toBe(2);
      expect(karmaTracker.calculateKarmaPoints({ messageType: 'Unknown Type' })).toBe(1);
    });
  });

  describe('getUserKarma', () => {
    test('should fetch user karma balance', async () => {
      const mockResponse = { data: { userId: 'user-123', karmaBalance: 150 } };
      axios.get.mockResolvedValue(mockResponse);

      const result = await karmaTracker.getUserKarma('user-123');

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/users/user-123/karma'),
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse.data);
    });

    test('should handle API errors when fetching karma', async () => {
      axios.get.mockRejectedValue(new Error('User not found'));

      await expect(karmaTracker.getUserKarma('invalid-user')).rejects.toThrow('Failed to get user karma: User not found');
    });

    test('should handle network timeouts', async () => {
      axios.post.mockRejectedValue(new Error('Request timeout'));

      const eventData = {
        userId: 'user-123',
        channel: 'email',
        type: 'transactional',
        messageType: 'Order Update',
        success: true
      };

      await expect(karmaTracker.logKarmaEvent(eventData)).rejects.toThrow('Karma event logging failed: Request timeout');
    });

    test('should handle invalid karma event data', async () => {
      const mockResponse = { data: { id: 'karma-123', success: true } };
      axios.post.mockResolvedValue(mockResponse);

      const invalidEventData = {
        userId: '', // Invalid: empty userId
        channel: 'email',
        type: 'transactional',
        messageType: 'Order Update',
        success: true
      };

      const result = await karmaTracker.logKarmaEvent(invalidEventData);

      // Should still work but with empty userId in the event
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/karma/events'),
        expect.objectContaining({
          userId: '',
          karmaType: 'SEVA',
          karmaGain: 2,
          karmaLoss: 0
        }),
        expect.any(Object)
      );
    });

    test('should handle all karma message types correctly', async () => {
      const mockResponse = { data: { id: 'karma-123', success: true } };
      axios.post.mockResolvedValue(mockResponse);

      const testCases = [
        { messageType: 'Order Update', expectedGain: 2 },
        { messageType: 'Delivery Alert', expectedGain: 3 },
        { messageType: 'CRM Alert', expectedGain: 1 },
        { messageType: 'Quick Notification', expectedGain: 1 },
        { messageType: 'Command Response', expectedGain: 2 },
        { messageType: 'Fallback Update', expectedGain: 1 },
        { messageType: 'Urgent Update', expectedGain: 4 },
        { messageType: 'Report', expectedGain: 2 },
        { messageType: 'Unknown Type', expectedGain: 1 }
      ];

      for (const testCase of testCases) {
        const eventData = {
          userId: 'user-123',
          channel: 'email',
          type: 'transactional',
          messageType: testCase.messageType,
          success: true
        };

        await karmaTracker.logKarmaEvent(eventData);

        expect(axios.post).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            karmaGain: testCase.expectedGain,
            karmaLoss: 0
          }),
          expect.any(Object)
        );
      }
    });
  });

  describe('getKarmaLedger', () => {
    test('should fetch user karma ledger', async () => {
      const mockLedger = {
        data: {
          userId: 'user-456',
          entries: [
            { id: 'entry-1', karmaGain: 2, activity: 'Order Update' },
            { id: 'entry-2', karmaGain: 3, activity: 'Delivery Alert' }
          ]
        }
      };
      axios.get.mockResolvedValue(mockLedger);

      const result = await karmaTracker.getKarmaLedger('user-456', 10);

      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/users/user-456/karma/ledger'),
        expect.objectContaining({ params: { limit: 10 } })
      );
      expect(result).toEqual(mockLedger.data);
    });

    test('should use default limit when not specified', async () => {
      axios.get.mockResolvedValue({ data: {} });

      await karmaTracker.getKarmaLedger('user-789');

      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ params: { limit: 50 } })
      );
    });
  });
});