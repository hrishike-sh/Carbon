const {
  MessageMenu,
  MessageMenuOption
} = require('discord-buttons');

module.exports = {
  name: 'help',
  async execute(message, args){
    const donoOption = new MessageMenuOption()
      .setLabel("Donations")
      .setEmoji('💸')
      .setValue('dono_op')
      .setDescription("Use this to manage donations in your server!")
    
    const fightOption = new MessageMenuOption()
      .setLabel("Fights")
      .setEmoji('🤜')
      .setValue('fight_op')

  }
}