const config = require('../config');

module.exports = {
  name: 'guildMemberAdd',

  async execute(member) {
    if (member.guild.id !== config.ids.guildId || member.user.bot) return;

    const now = new Date();
    const accountAge = (now - member.user.createdAt) / (1000 * 60 * 60 * 24);

    if (accountAge < 7) {
      await member.kick('Account too young').catch(() => {});
    }
  }
};
