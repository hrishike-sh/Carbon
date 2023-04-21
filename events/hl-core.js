const {
  Message,
  Client,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  Collection,
  ButtonStyle
} = require('discord.js');
const userSchema = require('../database/models/user');
const talked = [];
module.exports = {
  name: 'messageCreate',
  once: false,
  /**
   *
   * @param {Message} message
   * @param {Client} client
   */
  async execute(message, client) {
    client.counts.messages++;
    if (!message.guild) return;
    if (message.guild.id !== client.db.fighthub.id) return;
    if (message.author.bot) return;

    const userSettings = await userSchema.findOne({
      userId: message.author.id
    });

    if (userSettings?.messagesettings?.highlightsDisabled === true) return;

    const DB = client.db.hl.db;
    const hlWords = client.db.hl.all;
    const userInDb = client.db.hl.db.find((a) => a.userId == message.author.id);
    addUser(message.author, client);

    const hasHlWord = hlWords.some((a) =>
      message.content.toLowerCase().includes(` ${a.toLowerCase()} `)
    );
    if (!hasHlWord) return;
    const hlWord = hlWords.filter((word) =>
      message.content.toLowerCase().includes(word)
    )[0];
    const users = DB.filter(
      (a) =>
        a.highlight &&
        a.highlight.words.length &&
        a.highlight.words.includes(hlWord)
    );
    for (const user of users) {
      if (talked.includes(user.userId)) continue;
      let member;
      try {
        member = await message.guild.members.fetch({
          user: user.userId
        });
      } catch (e) {
        continue;
      }

      if (!member.permissionsIn(message.channel).has('ViewChannel')) continue;
      if (talked.includes(member.id)) continue;

      addUser(member, client);
      await client.functions.sleep(2500);
      const messages = await message.channel.messages.fetch({
        around: message.id,
        limit: 5
      });
      client.counts.hls++;
      let data = [];
      for (const msg of messages) {
        data.push(
          `[${client.functions.formatTime(msg[1].createdTimestamp, 'T')}] **${
            msg[1].author.tag
          }**: ${
            (msg[1].content.includes(hlWord)
              ? msg[1].content.replace(hlWord, `__${hlWord}__`)
              : msg[1].content) || ' '
          }`
        );
      }
      const embed = new EmbedBuilder()
        .setAuthor({
          name: 'One of your highlight has triggered!'
        })
        .setTitle(`Word: ${hlWord}`)
        .setDescription(data.reverse().join('\n'))
        .setTimestamp()
        .setColor('Random');
      (await member.user.createDM()).send({
        content: 'Your HL was triggered in ' + message.channel.toString(),
        embeds: [embed],
        components: [
          new ActionRowBuilder().addComponents([
            new ButtonBuilder()
              .setStyle(ButtonStyle.Link)
              .setURL(message.url)
              .setLabel('Jump to Message')
          ])
        ]
      });
    }
  }
};

const addUser = async (user, client) => {
  talked.push(user.id);
  await client.functions.sleep(60 * 1000);
  talked.splice(talked.indexOf(user.id), 1);
};
