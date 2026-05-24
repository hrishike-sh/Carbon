module.exports = {
  name: 'guildMemberAdd',

  async execute(member) {
    const now = new Date();
    const accountAge = (now - member.user.createdAt) / (1000 * 60 * 60 * 24);

    if (accountAge < 7) {
      await member.kick('Account too young').catch(() => {});
    }
  }
};
