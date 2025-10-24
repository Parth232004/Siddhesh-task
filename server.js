require('dotenv').config();
const express = require('express');
const { EventEmitter } = require('events');
const communicationController = require('./controllers/communicationController');
const karmaTracker = require('./services/karmaTracker');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Event emitter for communication events
const eventEmitter = new EventEmitter();

// Routes
app.use('/api/communication', communicationController(eventEmitter));

// Karma tracker integration
eventEmitter.on('communicationSent', async (eventData) => {
  try {
    await karmaTracker.logKarmaEvent(eventData);
  } catch (error) {
    console.error('Failed to log karma event:', error);
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Logistics Manager Communication Service is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Logistics Manager Communication Service listening on port ${PORT}`);
});

module.exports = { app, eventEmitter };