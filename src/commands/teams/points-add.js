const { Message, Client } = require('discord.js');
const TeamDB = require('../../database/models/teams');
const config = require('../../config');
const { successEmbed, errorEmbed } = require('../../utils/embeds');

module.exports = {
  name: 'points-add',
  aliases: ['padd'],
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    if (
      !message.member.roles.cache.hasAny(
        config.roles.staff.cman,
        config.roles.staff.admin,
        '1163857079300276254'
      )
    ) {
      return;
    }

    const t = args.shift();
    const user =
      message.mentions.members.first()?.id ||
      message.guild.members.cache.get(t)?.id;
    const points = args.shift();

    if (!user || !points) {
      return message.reply({
        embeds: [errorEmbed({ description: 'Usage: mention a team member followed by the number of points.' })]
      });
    }

    if (isNaN(points)) {
      return message.reply({
        embeds: [errorEmbed({ description: 'Points must be a valid number.' })]
      });
    }

    const updated = await TeamDB.updateOne(
      {
        users: user
      },
      {
        $inc: {
          points: parseInt(points)
        }
      },
      {
        upsert: true,
        new: true
      }
    );

    return message.reply({
      embeds: [
        successEmbed({
          title: 'Points updated',
          description: `Added **${points}** points to <@${user}>'s team.`
        })
      ]
    });
  }
};
