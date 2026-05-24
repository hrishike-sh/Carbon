const { InteractionType } = require('discord.js');
const config = require('../../config');

module.exports = {
  name: 'interactionCreate',

  async execute(int) {
    if (int.type !== InteractionType.MessageComponent) return;
    if (int.guild?.id !== config.ids.guildId) return;
    if (!int.customId.includes('prole')) return;

    const roleId = int.customId.replace('prole', '');

    if (int.member.roles.cache.has(roleId)) {
      await int.member.roles.remove(roleId);
      return int.reply({
        ephemeral: true,
        allowedMentions: { roles: [], users: [] },
        content: `I have removed your <@&${roleId}> role.`
      });
    }

    await int.member.roles.add(roleId);
    return int.reply({
      ephemeral: true,
      allowedMentions: { roles: [], users: [] },
      content: `I have added the <@&${roleId}> role.`
    });
  }
};
