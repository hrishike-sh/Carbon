const {
  Message,
  Events,
  MessageReaction,
  User,
  Colors,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const Database = require('../database/skullboard');
const skullboardChannelId = '1036564782481940510';
let processing = new Set();
module.exports = {
  name: 'messageReactionAdd',
  /**
   *
   * @param {MessageReaction} reaction
   * @param {User} user
   */
  async execute(reaction, user) {
    const message = reaction.message;
    if (!message.guild || message.guild.id != '824294231447044197') return;
    if (!reaction.emoji || reaction.emoji.name != '💀') return;
    if (processing.has(message.id)) return;
    processing.add(message.id);
    const fetched = await reaction.fetch();
    if (fetched.count < 5) {
      processing.delete(message.id);
      return;
    }

    let DBENTRY = await Database.findOne({
      'originalMessage.id': message.id
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

      DBENTRY.skullboardMessage = {
        id: msg.id
      };
      await DBENTRY.save();
    } else {
      const msg = await message.guild.channels.cache
        .get(skullboardChannelId)
        .messages.fetch(DBENTRY.skullboardMessage.id);

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
    }
    processing.delete(message.id);
  }
};
