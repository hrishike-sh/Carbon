const { Client, Message, Colors } = require('discord.js');
const giveaway = require('../database/giveaway');
const halloween = require('../database/halloween');
const Processing = new Set();
module.exports = {
  name: 'tick',
  /**
   *
   * @param {Client} client
   */
  async execute(client) {
    console.log('TICKRAN');
    await sleep(10000);
    client.emit('tick');
    const giveaways = await giveaway.find({});
    console.log(giveaways);
    if (giveaways.length === 0) {
      // make new gaw
      console.log('Giveaway length is zero');
      const g = {
        endsAt: new Date(Date.now() + 300000),
        prize:
          Math.floor(Math.random() * 5) + 5 * Math.sign(Math.random() - 0.5),
        channelId: '881128829131841596'
      };
      if (g.prize == 0) {
        g.prize = 1;
      }
      const channel = client.channels.cache.get(g.channelId);
      console.log(channel.name);
      const gawMessage = await channel.send({
        embeds: [
          {
            title: 'House Points',
            color: Colors.Green,
            description: `React with :tada: to enter!\nEnds <t:${Math.floor(
              g.endsAt.getTime() / 1000
            )}:R>\n\n*Prize may be positive or negative points*`,
            footer: {
              text: '1 Winner'
            },
            timestamp: new Date()
          }
        ]
      });
      console.log(gawMessage);
      g.messageId = gawMessage.id;
      await giveaway.create(g);
      await gawMessage.react('🎉');

      return;
    }

    // end gaw

    for (const gaw of giveaways) {
      const message = await client.channels.cache
        .get(gaw.channelId)
        .messages.fetch(gaw.messageId);

      if (!message) {
        // delete gaw
        giveaway.deleteOne({
          messageId: gaw.messageId
        });
        continue;
      }

      if (Processing.has(message.id)) {
        // already processed
        continue;
      }

      Processing.add(message.id);

      const winner = (await message.reactions.cache.first().users.fetch())
        .filter((a) => a.id !== client.user.id)
        .random();
      if (!winner) {
        // delete gaw
        await giveaway.deleteOne({
          messageId: gaw.messageId
        });
        continue;
      }

      // edit message

      await giveaway.deleteOne({
        messageId: gaw.messageId
      });

      await message.edit({
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
      });
      await halloween.updateOne(
        {
          members: winner.id
        },
        {
          $inc: {
            points: gaw.prize
          }
        }
      );
    }
  }
};

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
