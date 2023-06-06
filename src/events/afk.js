const { Message, Colors } = require('discord.js');
const DATABASE = require('../database/afk');
module.exports = {
  name: 'messageCreate',
  /**
   *
   * @param {Message} message message
   */
  async execute(message) {
    const client = message.client;

    if (message.author.bot) return;
    if (!message.guild) return;
    if (client.db.afks.includes(message.author.id)) {
      const dUser = await DATABASE.findOne({
        userId: message.author.id
      });
      message.reply(
        `Welcome back! I have removed your AFK. You were pinged **${dUser.dms.length} times** while you were gone. I have sent you a DM with the list.`
      );
      client.db.afks = client.db.afks.filter((a) => a !== message.author.id);
      await DATABASE.deleteOne({
        userId: message.author.id
      });
      const MAP = dUser?.dms
        .map(
          (msg) =>
            `[${parseTime(msg.time, 't')}] **${msg.tag}**: ${msg.content} ${
              msg.link ? '' : `[Jump](${msg.link})`
            })`
        )
        .join('\n');
      (await message.author.createDM()).send({
        embeds: [
          {
            title: 'Your pings:',
            description: MAP || 'You have no friends LMAO',
            color: Colors.Green,
            timestamp: new Date()
          }
        ]
      });
    }

    if (message.mentions.members.size > 0) {
      for (const [index, mention] of message.mentions.members) {
        if (client.db.afks.includes(mention.user.id)) {
          const db = await DATABASE.findOne({
            userId: mention.user.id
          });
          db.dms.push({
            time: message.createdTimestamp,
            content: message.content,
            tag: message.author.tag,
            link: message.url
          });
          db.save();
          message
            .reply({
              embeds: [
                {
                  title: `${mention.user.tag} is AFK!`,
                  color: Colors.Blurple,
                  description: `Reason: ${db.reason}\nLast seen ${parseTime(
                    db.time
                  )}`,
                  footer: {
                    text: "They will receive a DM about this when they're back!"
                  }
                }
              ],
              allowedMentions: {
                users: [],
                roles: []
              }
            })
            .then((msg) => {
              setTimeout(() => {
                msg.delete();
              }, 10_000);
            });
        }
      }
    }
  }
};

const parseTime = (time, format) => {
  return `<t:${(time / 1000).toFixed(0)}:${format || 'R'}>`;
};
