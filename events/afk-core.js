const db = require('../database/models/user');

const { Message, Client } = require('discord.js');

module.exports = {
  name: 'messageCreate',
  once: false,
  /**
   *
   * @param {Message} message
   * @param {Client} client
   * @returns
   */
  async execute(message, client) {
    if (!message.guild) return;
    if (message.guild.id !== client.config.guildId) return;
    if (message.author.bot) return;
    if (client.db.afkIgnore.includes(message.channel.id)) return;
    if (client.db.afks.includes(message.author.id)) {
      client.db.afks = client.db.afks.filter((u) => u !== message.author.id);
      message.member.setNickname(
        message.member.displayName.replace(/~ AFK/g, '')
      );
      message.channel
        .send(`Welcome back ${message.member}! I have removed your AFK.`)
        .then((msg) => {
          setTimeout(() => {
            msg.delete();
          }, 2500);
        });
      const u = await db.findOne({ userId: message.author.id });
      u.afk = {
        afk: false,
        reason: '',
        time: null
      };
      u.save();
      return;
    }
    if (message.mentions.users.size < 1) return;
    if (message.guild.id !== client.config.guildId) return;
    const mention = message.mentions.users.first().id;
    const user1 = await db.findOne({ userId: mention });

    if (!user1) return;
    if (!user1.afk.afk) return;

    return message.channel.send(
      `${message.mentions.users.first().username} is currently afk: ${
        user1.afk.reason
      } - <t:${(user1.afk.time / 1000).toFixed(0)}:R>`,
      {
        allowedMentions: {
          users: []
        }
      }
    );
  }
};
