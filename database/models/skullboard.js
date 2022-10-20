const mongoose = require('mongoose')

const SkullBoardSchema = new mongoose.Schema({
    authorId: String,
    messageId: String,
    channelId: String,
    guildId: String,
    count: 0,
    skullBoardMessageId: String,
})

module.exports = mongoose.model('skullboard', SkullBoardSchema, 'skullboard')
