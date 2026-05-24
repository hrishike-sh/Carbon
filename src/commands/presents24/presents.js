const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const Database = require('../../database/models/presents-dec-24');
const { successEmbed } = require('../../utils/embeds');

module.exports = {
  name: 'presents',
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    const user =
      message.mentions?.members?.first() ||
      message.guild.members.cache.get(args[0]) ||
      message.member;

    const db = await Database.findOne({
      userId: user.id
    });

    const PresentsEmbed = successEmbed({
      author: {
        name: user.user.username,
        iconURL: user.user.displayAvatarURL({ forceStatic: true })
      },
      description: `Presents: <:p24emj:1317523800946114652> **${
        db?.amount?.toLocaleString() || 0
      }**`,
      footer: 'You pick up presents when you chat!'
    });

    const Row = new ActionRowBuilder().addComponents([
      new ButtonBuilder()
        .setCustomId('p24-p')
        .setLabel('Presents')
        .setDisabled(true)
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('p24-l')
        .setLabel('Leaderboard')
        .setDisabled(false)
        .setStyle(ButtonStyle.Primary)
    ]);
    const msg = await message.reply({
      embeds: [PresentsEmbed],
      components: [Row]
    });
    const coll = msg.createMessageComponentCollector({
      idle: 30_000,
      dispose: true,
      filter: (i) => {
        if (i.user.id !== message.author.id) {
          i.reply({
            content: 'Not your interaction!',
            ephemeral: true
          });
          return false;
        } else return true;
      }
    });
    const lb = await Database.aggregate([
      {
        $sort: {
          amount: -1
        }
      },
      {
        $limit: 10
      },
      {
        $project: {
          userId: 1,
          amount: 1
        }
      }
    ]);
    let description = '';
    lb.map((value, index) => {
      description += `${index + 1}. <@${
        value.userId
      }> - **${value.amount.toLocaleString()}**\n`;
    });
    const LeaderboardEmbed = successEmbed({
      description,
      title: '<:p24emj:1317523800946114652> Leaderboard',
      timestamp: true
    });

    coll.on('collect', async (i) => {
      if (i.customId === 'p24-l') {
        Row.components[0].setDisabled(false).setStyle(ButtonStyle.Primary);
        Row.components[1].setDisabled(true).setStyle(ButtonStyle.Success);
        await i.update({
          embeds: [LeaderboardEmbed],
          components: [Row]
        });
      } else if (i.customId === 'p24-p') {
        Row.components[0].setDisabled(true).setStyle(ButtonStyle.Success);
        Row.components[1].setDisabled(false).setStyle(ButtonStyle.Primary);
        await i.update({
          embeds: [PresentsEmbed],
          components: [Row]
        });
      }
    });
    coll.on('end', async () => {
      Row.components.forEach((c) => {
        c.setDisabled();
        c.setStyle(ButtonStyle.Secondary);
      });
      await msg.edit({
        components: [Row]
      });
    });
  }
};
