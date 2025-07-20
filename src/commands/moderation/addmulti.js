const { Permissions } = require('discord.js');

module.exports = {
  name: 'addmulti',
  aliases: ['addrolemulti'],
  async execute(message, args) {
    if (
      !message.member.roles.cache.has('824539655134773269') &&
      !message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)
    ) {
      return message.reply('You do not have permission to use this command.');
    }

    const role =
      message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);
    if (!role) {
      return message.reply('Please specify a role to add.');
    }

    const users =
      message.mentions.users.size > 0
        ? message.mentions.users.map((u) => u.id)
        : args.slice(1);
    if (users.length === 0) {
      return message.reply(
        'Please specify at least one user to add the role to.'
      );
    }

    let successCount = 0;
    let errorCount = 0;
    for (const userId of users) {
      try {
        const member = await message.guild.members.fetch(userId);
        await member.roles.add(role);
        successCount++;
      } catch (error) {
        console.log(`Failed to add role to user ${userId}:`, error);
        errorCount++;
      }
    }

    message.reply(
      `Successfully added the **${role.name}** role to **${successCount}** users. Failed to add to **${errorCount}** users.`
    );
  }
};
