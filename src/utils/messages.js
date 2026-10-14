const { RESTJSONErrorCodes } = require('discord.js');
const logger = require('./logger');

// Collector cleanup can race with deletion, even when the end reason is a timeout.
async function editMessageSafely(message, options) {
  try {
    return await message.edit(options);
  } catch (error) {
    if (error.code !== RESTJSONErrorCodes.UnknownMessage) {
      logger.error(`Failed to edit message ${message.id}`, error);
    }
    return null;
  }
}

module.exports = { editMessageSafely };
