module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
  const createdAt = member.user.createdAt;
  
  // Get current date
  const now = new Date();
  
  // Calculate account age in days
  const accountAge = (now - createdAt) / (1000 * 60 * 60 * 24);
  
    if (accountAge < 7) {
        await member.kick('Account too young')
    }
  }
};
