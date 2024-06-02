const { Message, Events, MessageReaction, User } = require('discord.js');
const Database = require('../database/skullboard');
const skullboardChannelId = '1036564782481940510';
module.exports = {
  name: 'messageReactionAdd',
  /**
   *
   * @param {MessageReaction} reaction
   * @param {User} user
   */
  async execute(reaction, user) {
    const message = reaction.message;
    const member = message.guild.members.cache.get(user.id);

    if (!reaction.emoji || reaction.emoji.name != '💀') return;
    const fetched = await reaction.fetch();
    if (fetched.count < 0) return;

    let DBENTRY = await Database.findOne({
      'skullboardMessage.id': message.id
    });
    if (!DBENTRY) {
      DBENTRY = new Database({
        originalMessage: {
          channelId: message.channel.id,
          id: message.id
        },
        user: {
          id: message.author.id
        }
      });

      const msg = await message.guild.channels.cache
        .get(skullboardChannelId)
        .send({
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
              }
            }
          ]
        });

      DBENTRY.skullboardMessage = {
        id: msg.id
      };
      await DBENTRY.save();
    }
  }
};
