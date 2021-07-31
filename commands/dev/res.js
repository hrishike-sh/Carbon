const {Command} = require('discord.js-commando');
const { Client } = require('discord.js')
const client = new Client()
module.exports = class ResCommand extends Command {
  constructor(client){
    super(client, {
      name: 'res',
      aliases: ['restart'],
      group: "other",
      memberName: 'res',
      description: 'Restart',
    });
  }
  async run(message) {
      if(message.author.id !== '598918643727990784') return;

      message.react('✅')
      await client.destroy()
      await client.login(process.env.token)

      message.delete()
    }
}