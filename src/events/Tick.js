const { Client, Colors } = require('discord.js');
const giveaway = require('../database/giveaway');
const halloween = require('../database/halloween');
const Processing = new Set();

module.exports = {
  name: 'tick',
  /**
   * @param {Client} client
   */
  async execute(client) {
    console.log('TICKRAN');
    await sleep(30000); // 5 minutes
    client.emit('tick');

    try {
      const giveaways = await giveaway.find({});
      console.log(giveaways);

      if (giveaways.length === 0) {
        // Create a new giveaway if none are active
        console.log('No active giveaways, creating a new one...');
        const g = {
          endsAt: new Date(Date.now() + getMillis(new Date().getDate())),
          channelId: '1298986234412011541'
        };
        if (g.prize === 0) g.prize = 1;

        const channel = client.channels.cache.get(g.channelId);
        if (!channel) {
          console.error('Channel not found');
          return;
        }

        console.log(`Creating giveaway in channel: ${channel.name}`);
        const gawMessage = await channel
          .send({
            embeds: [
              {
                title: 'Bingo Giveaway',
                color: Colors.Green,
                description: `React with 🎉 to enter!\nEnds <t:${Math.floor(
                  g.endsAt.getTime() / 1000
                )}:R>`,
                footer: {
                  text: '1 Winner'
                },
                timestamp: new Date()
              }
            ]
          })
          .catch((err) => console.error('Failed to send message:', err));

        if (gawMessage) {
          g.messageId = gawMessage.id;
          await giveaway.create(g);
          await gawMessage.react('🎉');
        }

        return;
      }

      for (const gaw of giveaways) {
        if (new Date() < gaw.endsAt) continue;

        const message = await client.channels.cache
          .get('1298986234412011541')
          .messages.fetch(gaw.messageId)
          .catch((err) => console.error('Failed to fetch message:', err));

        if (!message) {
          await giveaway.deleteOne({ messageId: gaw.messageId });
          continue;
        }

        if (Processing.has(message.id)) {
          continue;
        }

        Processing.add(message.id);

        const winner = (await message.reactions.cache.first().users.fetch())
          .filter((a) => a.id !== client.user.id)
          .random();
        if (!winner) {
          await giveaway.deleteOne({ messageId: gaw.messageId });
          Processing.delete(message.id);
          continue;
        }

        await message
          .edit({
            embeds: [
              {
                title: 'House Points',
                color: Colors.Green,
                description: `**${winner}** won ${gaw.prize} points!`,
                footer: {
                  text: '1 Winner'
                },
                timestamp: new Date()
              }
            ]
          })
          .catch((err) => console.error('Failed to edit message:', err));
        await message.channel.send({
          content: winner.toString(),
          embeds: [
            {
              title: `[You won the Bingo Giveaway! 🥳](${message.url})`,
              color: Colors.Green
            }
          ]
        });
        await giveaway.deleteOne({ messageId: gaw.messageId });
        Processing.delete(message.id);
      }
    } catch (err) {
      console.error('Error in giveaway processing:', err);
    }
  }
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const getMillis = (t) => {
  return 10000;
};
