const { MessageEmbed } = require('discord.js')
const {Command} = require('discord.js-commando');

module.exports = class StrafeCommand extends Command {
  constructor(client){
    super(client, {
      name: 'straferate',
      aliases: ['sr'],
      group: "other",
      memberName: 'straferate',
      description: 'Check your <:strafe:864773381508431873> rate.',
    });
  }
    async run(message) {
      const user = message.mentions.users.size > 0 ? message.mentions.users.first() : message.author
      const isStrafe = user.id === '619339277993639956' ? true : false
      const rate = Math.floor(Math.random() * 100 - 1)

      const embed = new MessageEmbed()
            .setTitle('Strafe Rate')
            .setDescription(`<:strafe:864773381508431873> **You** are **${rate}%** strafe!`)

      message.channel.send(embed)
    }
}
