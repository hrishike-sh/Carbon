const mongoose = require('mongoose');
const logger = require('../utils/logger');

async function connectDatabase(uri) {
  try {
    await mongoose.connect(uri);
    logger.info('Connected to MongoDB');
  } catch (err) {
    logger.error('MongoDB connection failed', err);
    throw err;
  }

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB runtime error', err);
  });
}

async function disconnectDatabase() {
  await mongoose.disconnect();
  logger.info('Disconnected from MongoDB');
}

module.exports = { connectDatabase, disconnectDatabase };
