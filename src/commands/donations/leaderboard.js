const { Message, Client, EmbedBuilder } = require('discord.js');
const Main = require('../../database/main_dono');
const Grinder = require('../../database/grinder_dono');
const Karuta = require('../../database/tickets');

module.exports = {
  name: 'leaderboard',
  aliases: ['lb'],
  cooldown: 60,
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    const waitMessage = await message.reply('Fetching databases...');
    const MainRawLB = await Main.find({}).sort({
      messages: -1
    });
    const GrinderRawLB = await Grinder.find({}).sort({
      amount: -1
    });
    const KarutaRawLB = await Karuta.find({}).sort({
      amount: -1
    });
    await waitMessage.edit('Making fancy leaderboards...');
    const LBs = {
      main: [],
      grinder: [],
      karuta: []
    };

    for (const Profile of MainRawLB) {
      if (LBs.main.length > 9) break;
      const user =
        (await client.users.fetch(Profile.userID).catch(() => null)) ||
        'Unknown#00000';

      LBs.main.push(
        `${MainRawLB.indexOf(Profile) + 1}. **${user.tag}**: ⏣ ${
          Profile?.messages?.toLocaleString() || '0'
        }`
      );
    }
    for (const Profile of GrinderRawLB) {
      if (LBs.grinder.length > 9) break;
      const user =
        (await client.users.fetch(Profile.userID).catch(() => null)) ||
        'Unknown#00000';

      LBs.grinder.push(
        `${MainRawLB.indexOf(Profile) + 1}. **${user.tag}**: ⏣ ${
          Profile?.amount?.toLocaleString() || '0'
        }`
      );
    }
    for (const Profile of KarutaRawLB) {
      if (LBs.karuta.length > 9) break;
      const user =
        (await client.users.fetch(Profile.userId).catch(() => null)) ||
        'Unknown#00000';

      LBs.karuta.push(
        `${MainRawLB.indexOf(Profile) + 1}. **${user.tag}**: ⏣ ${
          Profile.amount.toLocaleString() || '0'
        }`
      );
    }
    const him = {
      main: MainRawLB.find((user) => user.userID == message.author.id) || null,
      grinder:
        GrinderRawLB.find((user) => user.userID == message.author.id) || null,
      karuta:
        KarutaRawLB.find((user) => user.userId == message.author.id) || null
    };
    waitMessage.delete();

    const MainEmbed = new EmbedBuilder()
      .setColor('Blurple')
      .setTitle('Main Donations Leaderboard')
      .setTimestamp()
      .setDescription(
        LBs.main.join('\n') +
          `\n\n${
            him.main
              ? `**${MainRawLB.indexOf(him.main) + 1}. ${
                  message.author.tag
                }: ⏣ ${him?.messages?.toLocaleString() || 'None'}**`
              : ''
          }`
      );
    const GrinderEmbed = new EmbedBuilder()
      .setColor(8666532)
      .setTitle('Grinder Donations Leaderboard')
      .setTimestamp()
      .setDescription(
        LBs.grinder.join('\n') +
          `\n\n${
            him.grinder
              ? `**${GrinderRawLB.indexOf(him.grinder) + 1}. ${
                  message.author.tag
                }: ⏣ ${him?.amount?.toLocaleString() || 'None'}**`
              : ''
          }`
      );
    const KarutaEmbed = new EmbedBuilder()
      .setColor('LuminousVividPink')
      .setTitle('Karuta Donations Leaderboard')
      .setTimestamp()
      .setDescription(
        LBs.karuta.join('\n') +
          `\n\n${
            him.karuta
              ? `**${KarutaRawLB.indexOf(him.karuta) + 1}. ${
                  message.author.tag
                }: ⏣ ${him?.amount?.toLocaleString() || 'None'}**`
              : ''
          }`
      );

    const testMessage = message.channel.send({
      embeds: [MainEmbed, GrinderEmbed, KarutaEmbed]
    });
  }
};
