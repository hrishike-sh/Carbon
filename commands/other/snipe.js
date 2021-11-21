const { MessageEmbed } = require('discord.js')
const settings = require('../../database/models/settingsSchema')

module.exports = {
  name: 'snipe',
  description: 'get sniped lol',
  disabledChannels: ['874330931752730674'],
  async execute(message, args, client) {
    const sniped = client.snipes.get(message.channel.id)
    // const guild = await settings.findOne({ guildID: message.guild.id }) || null

    // if(guild.snipes == false) return message.channel.send(`This server has snipes disabled!`)
    if (message.guild.id === '824294231447044197') {
      if (
        !message.member.roles.cache.some(role => role.id === '839803117646512128') &&
        !message.member.roles.cache.some(role => role.id === '826196972167757875') &&
        !message.member.roles.cache.some(role => role.id === '825283097830096908') &&
        !message.member.roles.cache.some(role => role.id === '824687393868742696')
      ) {
        return message.channel.send("You do not have permission to use this command, read <#843943148945276949> for more info.")
      }
    }
    if (!sniped || sniped == undefined) {
      message.channel.send("There is nothing to snipe!")
      return;
    }

    const snipe = +args[0] - 1 || 0
    const target = snipes[snipe]

    if (!target) return message.channel.send(`There are only ${sniped.length} messages to be sniped.`)

    const { msg, time, image } = target;

    return message.channel.send(new MessageEmbed().setAuthor(msg.author.tag, msg.author.displayAvatarURL()).setImage(image).setTimestamp(time).setFooter(`${sniped + 1}/${sniped.length}`))
  }
}