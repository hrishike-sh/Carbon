const {
  MessageEmbed
} = require("discord.js")

module.exports = {
  name: 'uptime',
  aliases: ['ut'],
  description: 'Bot Uptime, yeahhhhhhhhh',
  execute(message, args, client){
    let days = Math.floor(client.uptime / 86400000);
      let hours = Math.floor(client.uptime / 3600000) % 24;
      let minutes = Math.floor(client.uptime / 60000) % 60;
      let seconds = Math.floor(client.uptime / 1000) % 60;

      const upbed = new MessageEmbed()
        .setTitle('UPTIME')
        .setColor('#ff0000')
        .setDescription(`**Uptime:** ${days}days ${hours}hrs ${minutes}min ${seconds}sec`)
        .setTimestamp()

      
      message.channel.send({embed: upbed})
  }
}
