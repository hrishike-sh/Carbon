const { Message, Events, MessageReaction, User } = require('discord.js');
const Database = require('../database/skullboard');
module.exports = {
  name: Events.MessageReactionRemove,
  /**
   *
   * @param {MessageReaction} reaction
   * @param {User} user
   * @returns
   */
  async execute(reaction, user) {
    const message = reaction.message;
    if (!message.guild || message.guild.id != '824294231447044197') return;
    if (!reaction.emoji || reaction.emoji.name != '💀') return;
    const fetched = await reaction.fetch();
    const DBENTRY = await Database.findOne({
      'originalMessage.id': message.id
    });
    if (!DBENTRY) return;
    if (fetched.count > 10) {
      message.guild.channels.cache
        .get('1036564782481940510')
        .messages.fetch(DBENTRY.skullboardMessage.id)
        .then(async (msg) => {
          msg.edit({
            embeds: [
              {
                author: {
                  name: message.author.tag,
                  iconURL: message.author.displayAvatarURL()
                },
                title: `${fetched.count.toLocaleString()} :skull:`,
                description: message.content || '_ _',
                image: {
                  url: message.attachments?.first()?.url || null
                },
                color: Colors.Gold
              }
            ],
            components: [
              new ActionRowBuilder().addComponents([
                new ButtonBuilder()
                  .setStyle(ButtonStyle.Link)
                  .setEmoji('💀')
                  .setURL(message.url)
              ])
            ]
          });
        });
    } else {
      message.guild.channels.cache
        .get('1036564782481940510')
        .messages.fetch(DBENTRY.skullboardMessage.id)
        .then(async (msg) => {
          msg.delete();
        });
      await DBENTRY.delete();
      return;
    }
  }
};
