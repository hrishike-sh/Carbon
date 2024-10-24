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
    await sleep(10000); // 5 minutes
    client.emit('tick');

    try {
      const giveaways = await giveaway.find({});
      console.log(giveaways);

      if (giveaways.length === 0) {
        // Create a new giveaway if none are active
        console.log('No active giveaways, creating a new one...');
        const g = {
          endsAt: new Date(Date.now() + 300000), // 5 minutes from now
          prize:
            Math.floor(Math.random() * 5) + 5 * Math.sign(Math.random() - 0.5),
          channelId: '881128829131841596'
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
                title: 'House Points',
                color: Colors.Green,
                description: `React with 🎉 to enter!\nEnds <t:${Math.floor(
                  g.endsAt.getTime() / 1000
                )}:R>\n\n*Prize may be positive or negative points*`,
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

      // Check and end ongoing giveaways
      for (const gaw of giveaways) {
        if (new Date() < gaw.endsAt) continue; // Skip if giveaway hasn't ended yet

        const message = await client.channels.cache
          .get(gaw.channelId)
          .messages.fetch(gaw.messageId)
          .catch((err) => console.error('Failed to fetch message:', err));

        if (!message) {
          // If the message no longer exists, delete the giveaway from the database
          await giveaway.deleteOne({ messageId: gaw.messageId });
          continue;
        }

        if (Processing.has(message.id)) {
          // Already processing this giveaway
          continue;
        }

        Processing.add(message.id);

        const winner = (await message.reactions.cache.first().users.fetch())
          .filter((a) => a.id !== client.user.id)
          .random();
        if (!winner) {
          // No winner, delete the giveaway
          await giveaway.deleteOne({ messageId: gaw.messageId });
          Processing.delete(message.id);
          continue;
        }

        // Announce the winner
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

        // Update the database for the winner
        await halloween.updateOne(
          { members: winner.id },
          { $inc: { points: gaw.prize } }
        );

        // Remove processed giveaway
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
