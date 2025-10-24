const axios = require('axios');

class KarmaTracker {
  constructor() {
    this.baseURL = process.env.KARMA_TRACKER_BASE_URL || 'https://karma-tracker-api.example.com';
    this.apiKey = process.env.KARMA_TRACKER_API_KEY;
  }

  // Log karma event for communication activities
  async logKarmaEvent(eventData) {
    try {
      const karmaEvent = this.buildKarmaEvent(eventData);

      const response = await axios.post(`${this.baseURL}/api/karma/events`, karmaEvent, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Karma event logged successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to log karma event:', error.response?.data || error.message);
      throw new Error(`Karma event logging failed: ${error.message}`);
    }
  }

  // Build karma event based on communication type
  buildKarmaEvent(eventData) {
    const { userId, channel, type, messageType, success } = eventData;

    let karmaType = 'SEVA'; // Default karma type
    let karmaGain = 0;
    let karmaLoss = 0;

    // Determine karma based on message type and success
    if (success) {
      karmaGain = this.calculateKarmaPoints(eventData);
    } else {
      // Failed communications result in karma loss
      karmaLoss = -1;
      karmaType = 'KARMA_LOSS';
    }

    return {
      userId: userId,
      karmaType: karmaType,
      karmaGain: karmaGain,
      karmaLoss: karmaLoss,
      activity: `Communication via ${channel}: ${messageType}`,
      metadata: {
        channel: channel,
        type: type,
        messageType: messageType,
        timestamp: new Date().toISOString(),
        success: success
      }
    };
  }

  // Calculate karma points based on event type
  calculateKarmaPoints(eventData) {
    const karmaMatrix = {
      'Order Update': 2,
      'Delivery Alert': 3,
      'CRM Alert': 1,
      'Quick Notification': 1,
      'Command Response': 2,
      'Fallback Update': 1,
      'Urgent Update': 4,
      'Report': 2
    };

    return karmaMatrix[eventData.messageType] || 1;
  }


  // Get user's karma balance
  async getUserKarma(userId) {
    try {
      const response = await axios.get(`${this.baseURL}/api/users/${userId}/karma`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Failed to get user karma:', error);
      throw new Error(`Failed to get user karma: ${error.message}`);
    }
  }

  // Get karma ledger for user
  async getKarmaLedger(userId, limit = 50) {
    try {
      const response = await axios.get(`${this.baseURL}/api/users/${userId}/karma/ledger`, {
        params: { limit },
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return response.data;
    } catch (error) {
      console.error('Failed to get karma ledger:', error);
      throw new Error(`Failed to get karma ledger: ${error.message}`);
    }
  }
}

module.exports = new KarmaTracker();