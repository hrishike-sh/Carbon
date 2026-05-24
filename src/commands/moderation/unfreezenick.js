const { Message } = require('discord.js');
const DB = require('../../database/models/freezenick');
const config = require('../../config');

module.exports = {
  name: 'unfreezenick',
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   */
  async execute(message, args) {
    if (
      !message.member.roles.cache.hasAny(
        config.roles.staff.mod,
        config.roles.staff.admin
      )
    ) {
      return message.reply('You cannot run this command!');
    }

    const user = message.mentions.members.first();
    if (!user)
      return message.reply(`Please mention a user to unfreeze their nickname.`);

    const data = await DB.findOne({ userId: user.id });
    if (!data) {
      return message.reply(`This user's nickname is not frozen.`);
    }

    await DB.findOneAndDelete({ userId: user.id });
    try {
      await user.setNickname(null);
    } catch (error) {
      console.error(error);
    }

    message.reply(`Successfully unfroze ${user.user.tag}'s nickname.`);
  }
};
