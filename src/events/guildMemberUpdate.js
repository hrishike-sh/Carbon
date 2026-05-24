const config = require('../config');
const DB = require('../database/models/freezenick');

module.exports = {
  name: 'guildMemberUpdate',

  async execute(oldMember, newMember) {
    if (oldMember.guild.id !== config.ids.guildId) return;

    if (oldMember.nickname !== newMember.nickname) {
      const data = await DB.findOne({ userId: newMember.id });
      if (data) {
        await newMember.setNickname(data.name).catch(() => {});
      }
    }
  }
};
