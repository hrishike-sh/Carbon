const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const Main = require('../../database/models/main_dono');
const Grinder = require('../../database/models/grinder_dono');
const Karuta = require('../../database/models/tickets');
const { Theme } = require('../../utils/embeds');

async function loadLeaderboard(model, filter, userField, amountField, userId) {
  const [leaders, own] = await Promise.all([
    model.find(filter).sort({ [amountField]: -1, _id: 1 }).limit(10).select(`${userField} ${amountField}`).lean(),
    model.findOne({ ...filter, [userField]: userId }).select(`${userField} ${amountField}`).lean()
  ]);
  const rank = own ? 1 + await model.countDocuments({
    ...filter,
    $or: [
      { [amountField]: { $gt: own[amountField] } },
      { [amountField]: own[amountField], _id: { $lt: own._id } }
    ]
  }) : null;
  return { leaders, own, rank, userField, amountField };
}

module.exports = {
  name: 'leaderboard',
  aliases: ['lb'],
  cooldown: 60,
  async execute(message, args, client) {
    const mainMessage = await message.reply('Fetching leaderboards...');
    const guildFilter = { guildID: message.guild.id };
    const boards = await Promise.all([
      loadLeaderboard(Main, guildFilter, 'userID', 'messages', message.author.id),
      loadLeaderboard(Grinder, guildFilter, 'userID', 'amount', message.author.id),
      loadLeaderboard(Karuta, {}, 'userId', 'amount', message.author.id)
    ]);
    const users = new Map();
    for (const board of boards) {
      for (const profile of board.leaders) {
        const id = profile[board.userField];
        if (!users.has(id)) users.set(id, client.users.fetch(id).catch(() => null));
      }
    }
    await Promise.all(users.values());
    const names = ['Main', 'Grinder', 'Karuta'];
    const embeds = await Promise.all(boards.map(async (board, index) => {
      const currency = index === 2 ? ':tickets:' : '⏣';
      const lines = await Promise.all(board.leaders.map(async (profile, position) => {
        const user = await users.get(profile[board.userField]);
        return `${position + 1}. **${user?.tag || `Unknown user (${profile[board.userField]})`}**: ${currency} ${(profile[board.amountField] || 0).toLocaleString()}`;
      }));
      if (board.own) {
        lines.push(`\n**${board.rank > 49 ? '50+' : board.rank}. ${message.author.tag}: ${currency} ${(board.own[board.amountField] || 0).toLocaleString()}**`);
      }
      return new EmbedBuilder()
        .setTitle(`${names[index]} Donations Leaderboard`)
        .setColor(index === 1 ? Theme.success : Theme.info)
        .setTimestamp()
        .setDescription(lines.join('\n') || 'No donations recorded yet.');
    }));
    const buttons = names.map((name, index) => new ButtonBuilder()
      .setCustomId(`donations_lb_${index}`)
      .setLabel(name)
      .setStyle(index === 0 ? ButtonStyle.Success : ButtonStyle.Primary)
      .setDisabled(index === 0));
    const row = new ActionRowBuilder().addComponents(buttons);
    await mainMessage.edit({ content: null, embeds: [embeds[0]], components: [row] });
    const collector = mainMessage.createMessageComponentCollector({ idle: 30_000, time: 300_000 });
    collector.on('collect', async (button) => {
      try {
        if (button.user.id !== message.author.id) {
          await button.reply({ content: 'Not your command.', flags: 64 });
          return;
        }
        const selected = Number(button.customId.split('_').at(-1));
        if (!Number.isInteger(selected) || !embeds[selected]) return;
        buttons.forEach((item, index) => item.setDisabled(index === selected)
          .setStyle(index === selected ? ButtonStyle.Success : ButtonStyle.Primary));
        await button.update({ embeds: [embeds[selected]], components: [row] });
      } catch (error) {
        console.error('Donation leaderboard interaction failed:', error);
      }
    });
    collector.on('end', () => {
      buttons.forEach((button) => button.setDisabled(true));
      mainMessage.edit({ components: [row] }).catch(() => {});
    });
  }
};
