const { Events, GuildMember } = require('discord.js');
const DB = require('../database/freezenick');
module.exports = {
  name: Events.GuildMemberUpdate,
  /**
   *
   * @param {GuildMember} oldMember
   * @param {GuildMember} newMember
   */
  async execute(oldMember, newMember) {
    if (oldMember.guild.id != '824294231447044197') return;

    if (oldMember.nickname != newMember.nickname) {
      const data = await DB.findOne({ userId: newMember.id });
      if (data) {
        await newMember.setNickname(data.name);
      }
    }
  }
};
