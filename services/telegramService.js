const TelegramBot = require('node-telegram-bot-api');

class TelegramService {
  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN;
    this.bot = new TelegramBot(this.botToken, { polling: false });
  }

  async sendMessage(chatId, message, type = 'notification') {
    try {
      const options = {};

      // Add keyboard for command responses
      if (type === 'command') {
        options.reply_markup = {
          keyboard: [
            [{ text: '/status' }, { text: '/help' }],
            [{ text: '/orders' }, { text: '/support' }]
          ],
          resize_keyboard: true,
          one_time_keyboard: true
        };
      }

      const result = await this.bot.sendMessage(chatId, message, options);

      console.log('Telegram message sent successfully:', result.message_id);

      return {
        messageId: result.message_id,
        success: true
      };
    } catch (error) {
      console.error('Telegram message sending failed:', error);
      throw new Error(`Telegram message sending failed: ${error.message}`);
    }
  }

  // Send quick notification with inline buttons
  async sendQuickNotification(chatId, title, message, buttons = []) {
    try {
      const inlineKeyboard = buttons.map(button => ([{
        text: button.text,
        callback_data: button.callbackData
      }]));

      const result = await this.bot.sendMessage(chatId, `*${title}*\n\n${message}`, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: inlineKeyboard
        }
      });

      return {
        messageId: result.message_id,
        success: true
      };
    } catch (error) {
      console.error('Telegram quick notification sending failed:', error);
      throw new Error(`Telegram quick notification sending failed: ${error.message}`);
    }
  }

  // Handle incoming messages (for command responses)
  setupMessageHandler(handler) {
    this.bot.on('message', handler);
  }

  // Handle callback queries from inline buttons
  setupCallbackHandler(handler) {
    this.bot.on('callback_query', handler);
  }

  // Send location-based notification
  async sendLocationNotification(chatId, latitude, longitude, message) {
    try {
      const result = await this.bot.sendLocation(chatId, latitude, longitude, {
        reply_markup: {
          inline_keyboard: [[
            { text: 'Track Delivery', callback_data: 'track_delivery' }
          ]]
        }
      });

      // Send accompanying message
      await this.bot.sendMessage(chatId, message, {
        reply_to_message_id: result.message_id
      });

      return {
        messageId: result.message_id,
        success: true
      };
    } catch (error) {
      console.error('Telegram location notification sending failed:', error);
      throw new Error(`Telegram location notification sending failed: ${error.message}`);
    }
  }

  // Get bot info
  async getBotInfo() {
    try {
      return await this.bot.getMe();
    } catch (error) {
      console.error('Failed to get bot info:', error);
      throw new Error(`Failed to get bot info: ${error.message}`);
    }
  }
}

module.exports = new TelegramService();