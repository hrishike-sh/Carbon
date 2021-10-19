const {
  MessageEmbed
} = require("discord.js")

module.exports = {
  name: 'uptime',
  aliases: ['ut'],
  description: 'Bot Uptime, yeahhhhhhhhh',
  execute(message, args, client){
    const uptime = (new Date() / 1000 - client.uptime / 1000).toFixed();

    await message.channel.send({
        content: `Ping: ${Math.round(client.ws.ping)}ms\nUp since: <t:${uptime}:R>`
    });
  }
}
