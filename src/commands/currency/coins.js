const DB = require('../../database/coins');
const {
  Message,
  ButtonBuilder,
  ActionRowBuilder,
  EmbedBuilder,
  Colors,
  ButtonStyle
} = require('discord.js');
const emoji = '<:token:1003272629286883450>';
module.exports = {
  name: 'coins',
  cooldown: 3,
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @returns
   */
  async execute(message, args, client) {
    const target = args[0]?.replace(/[^0-9]/g, '') || message.author.id;
    const DBUser = await DB.findOne({
      userId: target
    });

    if (!DBUser) return message.reply('No result.');
    const user = await message.guild.members
      .fetch({
        user: target
      })
      .catch((a) => null);
    if (!user) return message.reply('No such user found.');
    const embed = new EmbedBuilder()
      .setAuthor({
        name: user.user.tag,
        iconURL: user.user.displayAvatarURL()
      })
      .setTitle("You get random coins while you're chatting!")
      .setDescription(`**Coins:** ${emoji} ${DBUser.coins.toLocaleString()}`)
      .setTimestamp()
      .setColor(Colors.Blurple);
    const balanceButton = new ButtonBuilder()
      .setLabel('Coins')
      .setCustomId('balance;coins')
      .setStyle(ButtonStyle.Success)
      .setDisabled();
    const leaderboardButton = new ButtonBuilder()
      .setLabel('Leaderboard')
      .setCustomId('lb;coins')
      .setStyle(ButtonStyle.Primary);
    const row = new ActionRowBuilder().addComponents([
      balanceButton,
      leaderboardButton
    ]);

    const mainMessage = await message.reply({
      embeds: [embed],
      components: [row]
    });
    const collector = mainMessage.createMessageComponentCollector({
      idle: 30_000
    });

    collector.on('end', () => {
      balanceButton.setDisabled().setStyle(ButtonStyle.Secondary);
      leaderboardButton.setDisabled().setStyle(ButtonStyle.Secondary);
      mainMessage.edit({
        components: [row]
      });
    });

    collector.on('collect', async (button) => {
      if (button.user.id !== message.author.id) {
        button.reply({
          content: 'Not your command.',
          ephemeral: true
        });
        return;
      }
      const rawlb = await DB.find()
        .sort({
          coins: -1
        })
        .limit(10);
      let description = '';
      for (let i = 0; i < rawlb.length; i++) {
        const tag =
          (await client.users.fetch(rawlb[i].userId).catch((e) => null)).tag ||
          'Unknown#00000';
        description += `${i + 1}. **${tag}**: ${emoji} ${rawlb[
          i
        ].coins.toLocaleString()}\n`;
      }
      if (button.customId == 'balance;coins') {
        leaderboardButton.setDisabled(false).setStyle(ButtonStyle.Primary);
        balanceButton.setDisabled(true).setStyle(ButtonStyle.Success);
        button.deferUpdate();
        mainMessage.edit({
          embeds: [embed],
          components: [row]
        });
      } else {
        leaderboardButton.setDisabled(true).setStyle(ButtonStyle.Success);
        balanceButton.setDisabled(false).setStyle(ButtonStyle.Primary);
        button.deferUpdate();

        mainMessage.edit({
          embeds: [
            {
              title: 'Leaderboard',
              color: Colors.Green,
              description,
              timestamp: new Date()
            }
          ],
          components: [row]
        });
      }
    });
  }
};
