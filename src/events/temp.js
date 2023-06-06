const {
  Message,
  EmbedBuilder,
  Events,
  ButtonInteraction
} = require('discord.js');
const HEISTS = require('../database/heist');
const MAIN = require('../database/main_dono');
module.exports = {
  name: Events.InteractionCreate,
  /**
   *
   * @param {ButtonInteraction} button
   */
  async execute(button) {
    if (button.customId !== 'transfer_notes') return;

    const userID = button.user.id;
    const HeistDB = await HEISTS.findOne({
      userID
    });
    if (!HeistDB) {
      button.reply({
        content:
          'You either have no heist donations or have already transferred them...',
        ephemeral: true
      });
      return;
    }
    let MainDB = await MAIN.findOne({
      userID,
      guildID: button.guild.id
    });
    if (!MainDB?.messages) {
      MainDB = new MAIN({
        userID,
        guildID: button.guild.id,
        messages: 0
      });
    }

    const amount = HeistDB.amount;
    MainDB.messages += amount;
    MainDB.save();

    await HEISTS.deleteOne({
      userID
    });

    return button.reply({
      embeds: [
        {
          color: Colors.Green,
          description: `+${amount.toLocaleString()} has been added to your Main Donations.`,
          footer: {
            text: 'Check your donations using fh myd'
          }
        }
      ],
      ephemeral: true
    });
  }
};
