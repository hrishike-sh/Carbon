const { Client, Message } = require('discord.js');
const db = require('../../database/models/user');
module.exports = {
  name: 'voterm',
  fhOnly: false,
  disabledChannels: [],
  /**
   * @param {Client} client
   * @param {Message} message
   * @param {String[]} args
   */
  async execute(message, args, client) {
    let user = await db.findOne({
      userId: message.author.id
    });

    if (!user) {
      user = new db({
        userId: message.author.id,
        fighthub: {
          voting: {
            hasVoted: false,
            enabled: true,
            lastVoted: new Date().getTime()
          }
        }
      });
    }

    if (user.fighthub.voting.enabled == false) {
      user.fighthub.voting.enabled = true;
      user.save();

      await message.channel.send(
        `Toggled the voting reminder.\nIt is now \`enabled\`.`
      );
    } else {
      user.fighthub.voting.enabled = false;
      user.save();

      await message.channel.send(
        `Toggled the voting reminder.\nIt is now \`disabled\`.`
      );
    }
  }
};
