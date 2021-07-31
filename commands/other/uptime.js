const {
  Client,
  MessageEmbed
} = require("discord.js")
const client = new Client()
const {Command} = require('discord.js-commando');

module.exports = class UptimeCommand extends Command {
  constructor(client){
    super(client, {
      name: 'uptime',
      group: "other",
      memberName: 'uptime',
      description: 'Check bot\'s uptime',
    });
  }
  async run(message) {
      let days = Math.floor(client.uptime / 86400000);
      let hours = Math.floor(client.uptime / 3600000) % 24;
      let minutes = Math.floor(client.uptime / 60000) % 60;
      let seconds = Math.floor(client.uptime / 1000) % 60;

      const upbed = new MessageEmbed()
        .setTitle('UPTIME')
        .setColor('#ff0000')
        .setDescription(`**Uptime:** ${days}days ${hours}hrs ${minutes}min ${seconds}sec`)
        .setTimestamp()

      
      message.channel.send(upbed)

    }
}

client.login(process.env.token)