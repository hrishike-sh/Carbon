const { Client, Message } = require('discord.js');
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
    await sleep(5000);
    client.emit('tick');
    const giveaways = await giveaway.find({
      endsAt: {
        $lte: new Date()
      }
    });
    console.log(giveaways);
    if (giveaways.length == 0) {
      // make new gaw

      const g = new giveaway({
        endsAt: new Date(new Date().getTime() * 300000),
        prize:
          Math.floor(Math.random() * 5) + 5 * Math.sign(Math.random() - 0.5),
        channelId: '881128829131841596'
      });

      const gawMessage = await client.channels.cache
        .get('881128829131841596')
        .send({
          embeds: [
            {
              title: 'House Points',
              color: '00f664',
              description: `React with :tada: to enter!\nEnds <t:${Math.floor(
                g.endsAt.getTime() / 1000
              )}:R>\n\n*Prize may be positive or negative points*`,
              footer: {
                text: '1 Winner'
              },
              timestamp: g.endsAt
            }
          ]
        });

      g.messageId = gawMessage.id;
      gawMessage.react('🎉');
      await g.save();

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

      const winner = (
        await message.reactions.cache.first().users.fetch()
      ).random();
      if (!winner) {
        // delete gaw
        giveaway.deleteOne({
          messageId: gaw.messageId
        });
        continue;
      }

      // edit message
      return;
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
