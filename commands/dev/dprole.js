
const {
  MessageButton,
  MessageActionRow
} = require('discord-buttons')
const grinds = require('../../database/models/grindm')
module.exports = {
  name: 'test',
  descriprtion: 'Not for you to see.',
  async execute(message, args){
    const all = await grindm.find({ guildID: '824294231447044197' })

    try{
      all.forEach(model => {
        model.lastUpdated = 1
        model.save
      })
    } catch (e) {
      return message.channel.send("ERROR" + e)
    }
  }
}