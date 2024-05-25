const { Message, Interaction, InteractionType } = require('discord.js');

module.exports = {
  name: 'interactionCreate',
  /**
   *
   * @param {Interaction} int
   */
  async execute(int) {
    /**
     * Checks
     */
    if (int.type !== InteractionType.MessageComponent) return;
    if (int.guild?.id !== '824294231447044197') return;
    if (!int.customId.includes('prole')) return;
    /**
     * Checks
     */

    const roleId = int.customId.replace('prole', '');
    if (int.member.roles.cache.has(roleId)) {
      int.member.roles.remove(roleId);
      return int.reply({
        ephemeral: true,
        allowedMentions: {
          roles: [],
          users: []
        },
        content: `I have removed your <@&${roleId}> role.`
      });
    } else {
      int.member.roles.add(roleId);
      return int.reply({
        ephemeral: true,
        allowedMentions: {
          roles: [],
          users: []
        },
        content: `I have added the <@&${roleId}> role.`
      });
    }
  }
};
