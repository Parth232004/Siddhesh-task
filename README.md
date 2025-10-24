# Logistics Manager - Omni-Channel Communication & Karma Layer

A Node.js/Express service that integrates multiple communication channels (Zoho Mail, WhatsApp, Telegram, SMS) with a Karma Tracker system for the Logistics Manager application.

## Features

### Omni-Channel Communication
- **Email**: Zoho Mail integration for transactional and report emails
- **WhatsApp**: Cloud API and Twilio integration for delivery and CRM alerts
- **Telegram**: Bot API for quick notifications and command responses
- **SMS**: Twilio and Fast2SMS integration for fallback and urgent updates

### Karma Tracker Integration
- Automatic karma logging for every communication event
- Karma points based on communication type and success
- Integration with Siddhesh's Karma Tracker API
- Real-time karma ledger updates

## Project Structure

```
├── controllers/
│   └── communicationController.js    # Unified communication routing
├── services/
│   ├── emailService.js              # Zoho Mail integration
│   ├── whatsappService.js           # WhatsApp Cloud API & Twilio
│   ├── telegramService.js           # Telegram Bot API
│   ├── smsService.js                # SMS via Twilio/Fast2SMS
│   └── karmaTracker.js              # Karma Tracker integration
├── tests/
│   ├── communication.test.js        # Communication controller tests
│   └── karmaTracker.test.js         # Karma tracker tests
├── server.js                        # Main application server
├── package.json                     # Dependencies and scripts
├── .env.sample                      # Environment variables template
└── README.md                        # This documentation
```

## Installation

1. **Install Node.js** (version 14 or higher)
2. **Clone or download** this project
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Configure environment variables**:
   ```bash
   cp .env.sample .env
   # Edit .env with your API keys and configuration
   ```
5. **Start the service**:
   ```bash
   npm start
   # Or for development with auto-restart:
   npm run dev
   ```

## Environment Configuration

Copy `.env.sample` to `.env` and configure the following:

### Email (Zoho Mail)
```env
ZOHO_SMTP_HOST=smtp.zoho.com
ZOHO_EMAIL=your-email@yourdomain.com
ZOHO_PASSWORD=your-zoho-password
ZOHO_ACCESS_TOKEN=your-zoho-access-token
```

### WhatsApp
```env
WHATSAPP_PHONE_NUMBER_ID=your-whatsapp-phone-number-id
WHATSAPP_ACCESS_TOKEN=your-whatsapp-access-token
```

### Twilio (WhatsApp & SMS)
```env
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=+1234567890
```

### Telegram
```env
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
```

### SMS (Fast2SMS Alternative)
```env
FAST2SMS_API_KEY=your-fast2sms-api-key
FAST2SMS_SENDER_ID=YOURID
```

### Karma Tracker
```env
KARMA_TRACKER_BASE_URL=https://karma-tracker-api.example.com
KARMA_TRACKER_API_KEY=your-karma-tracker-api-key
```

## API Endpoints

### Communication Endpoints

#### Send Email
```http
POST /api/communication/email
Content-Type: application/json

{
  "to": "recipient@example.com",
  "subject": "Order Update",
  "body": "<h1>Your order status has been updated</h1>",
  "type": "transactional",
  "userId": "user-123"
}
```

#### Send WhatsApp Message
```http
POST /api/communication/whatsapp
Content-Type: application/json

{
  "to": "+1234567890",
  "message": "Your delivery is on the way!",
  "type": "delivery",
  "userId": "user-456"
}
```

#### Send Telegram Message
```http
POST /api/communication/telegram
Content-Type: application/json

{
  "chatId": "123456789",
  "message": "Quick notification: Order processed",
  "type": "notification",
  "userId": "user-789"
}
```

#### Send SMS
```http
POST /api/communication/sms
Content-Type: application/json

{
  "to": "+1234567890",
  "message": "Urgent: Delivery delayed",
  "type": "urgent",
  "userId": "user-101"
}
```

#### Unified Send Endpoint
```http
POST /api/communication/send
Content-Type: application/json

{
  "channel": "email|whatsapp|telegram|sms",
  "userId": "user-123",
  // ... channel-specific parameters
}
```

### Karma Points System

| Message Type | Karma Points |
|--------------|--------------|
| Order Update | +2 |
| Delivery Alert | +3 |
| CRM Alert | +1 |
| Quick Notification | +1 |
| Command Response | +2 |
| Fallback Update | +1 |
| Urgent Update | +4 |
| Report | +2 |
| Failed Communication | -1 |

## Karma Tracker Integration

Every communication event automatically logs karma points using Siddhesh's Karma Tracker API:

```javascript
// Sample karmaEvent.post() call
await karmaTracker.karmaEventPost({
  userId: 'user-123',
  channel: 'email',
  type: 'transactional',
  messageType: 'Order Update',
  success: true
});
```

## Testing

Run the test suite:
```bash
npm test
```

### Test Coverage
- Communication controller functionality
- Service integrations (mocked)
- Karma event logging
- Error handling
- Event-driven architecture

## Event-Driven Architecture

The service uses Node.js EventEmitter for decoupling communication events from karma tracking:

```javascript
// Communication events trigger karma logging
eventEmitter.emit('communicationSent', {
  userId: userId,
  channel: channel,
  type: type,
  messageType: messageType,
  success: true
});
```

## API Flow

1. **Client Request** → Communication Controller
2. **Channel Selection** → Appropriate Service (Email/WhatsApp/Telegram/SMS)
3. **Message Sending** → External API Call
4. **Success/Failure** → Event Emission
5. **Karma Logging** → Karma Tracker API Call
6. **Response** → Client

## Error Handling

- Comprehensive error handling for all API calls
- Graceful degradation (fallback channels)
- Detailed logging for debugging
- Karma loss for failed communications

## Security Considerations

- API keys stored in environment variables
- Input validation and sanitization
- Rate limiting considerations
- Secure communication with external APIs

## Monitoring & Logging

- Console logging for all operations
- Karma event tracking
- Error logging with stack traces
- Health check endpoint: `GET /health`

## Deployment

1. Set up production environment variables
2. Configure webhook endpoints for external services
3. Set up monitoring and alerting
4. Deploy to production server
5. Test all communication channels
6. Verify karma tracking integration

## Contributing

1. Follow the existing code structure
2. Add tests for new features
3. Update documentation
4. Ensure all tests pass

## Support

For issues or questions:
- Check the logs for error details
- Verify API credentials and configuration
- Test individual services manually
- Review the Karma Tracker API documentation

## License

ISC License - See package.json for details.