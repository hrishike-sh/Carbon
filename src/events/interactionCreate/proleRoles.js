const { InteractionType } = require('discord.js');
const config = require('../../config');

module.exports = {
  name: 'interactionCreate',

  async execute(int) {
    if (int.type !== InteractionType.MessageComponent) return;
    if (int.guild?.id !== config.ids.guildId) return;
    if (!/^prole\d{17,20}$/.test(int.customId)) return;

    const roleId = int.customId.replace('prole', '');
    await int.deferReply({ flags: 64 });

    if (int.member.roles.cache.has(roleId)) {
      await int.member.roles.remove(roleId);
      return int.editReply({
        allowedMentions: { roles: [], users: [] },
        content: `I have removed your <@&${roleId}> role.`
      });
    }

    await int.member.roles.add(roleId);
    return int.editReply({
      allowedMentions: { roles: [], users: [] },
      content: `I have added the <@&${roleId}> role.`
    });
  }
};
