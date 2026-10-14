const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config');
const { Theme } = require('../../utils/embeds');

const cooldowns = new Map();
const ALLOWED_CHANNELS = ['853280287777882142', '1272547714617446440'];
const PING_ROLES = config.roles.pingRoles;
const ROLE_CHOICES = [
  { name: 'Giveaway Ping', value: PING_ROLES.giveaway },
  { name: 'Event Ping', value: PING_ROLES.event },
  { name: 'Mini Gaw and Event Ping', value: PING_ROLES.miniGawEvent },
  { name: 'Mafia Ping', value: PING_ROLES.mafia }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pingrole')
    .setDescription('Ping roles!')
    .addStringOption((option) => option.setName('role').setDescription('Ping Cooldown: 30 minutes / role').addChoices(...ROLE_CHOICES).setRequired(true))
    .addStringOption((option) => option.setName('prize').setDescription('Prize of the event.').setMaxLength(500).setRequired(true))
    .addUserOption((option) => option.setName('sponsor').setDescription('Sponsor of the giveaway/event').setRequired(true))
    .addBooleanOption((option) => option.setName('event').setDescription('Is it an event?').setRequired(true))
    .addStringOption((option) => option.setName('requirement').setDescription('Requirement for the event (dont mention for giveaway)').setMaxLength(500))
    .addStringOption((option) => option.setName('message').setDescription('Message from the sponsor.').setMaxLength(1000))
    .addStringOption((option) => option.setName('event-type').setDescription('Type of the event. (rumble, bo3 kick etc.)').setMaxLength(500)),

  async execute(interaction) {
    if (!interaction.member?.roles?.cache?.hasAny(
      config.roles.staff.admin, config.roles.staff.cman, config.roles.staff.mod, config.roles.giveawayManager
    )) {
      return interaction.reply({ content: "You can't use this!", flags: 64 });
    }
    if (!ALLOWED_CHANNELS.includes(interaction.channelId)) {
      return interaction.reply({ content: 'You can only use this command in allowed channels.', flags: 64 });
    }
    const role = interaction.options.getString('role', true);
    if (!ROLE_CHOICES.some((choice) => choice.value === role)) {
      return interaction.reply({ content: 'That role cannot be pinged with this command.', flags: 64 });
    }
    const key = `${interaction.guildId}:${role}`;
    const now = Date.now();
    for (const [entry, expiresAt] of cooldowns) {
      if (expiresAt <= now) cooldowns.delete(entry);
    }
    const expiresAt = cooldowns.get(key);
    if (expiresAt) {
      return interaction.reply({ content: `This ping is on cooldown! Try again <t:${Math.floor(expiresAt / 1000)}:R>`, flags: 64 });
    }

    // Reserve before awaiting Discord so simultaneous commands cannot bypass the cooldown.
    cooldowns.set(key, now + 1800000);
    let sent = false;
    try {
      await interaction.deferReply({ flags: 64 });
      const sponsor = interaction.options.getUser('sponsor', true);
      const isEvent = role === PING_ROLES.event || role === PING_ROLES.mafia ||
        (role === PING_ROLES.miniGawEvent && interaction.options.getBoolean('event', true));
      const payload = {
        content: `<@&${role}>: Make sure to thank ${sponsor} in <#870240187198885888>!`,
        allowedMentions: { roles: [role], users: [sponsor.id] }
      };
      if (isEvent) {
        const lines = [
          `⦿ **Event:** ${interaction.options.getString('event-type') || (role === PING_ROLES.mafia ? 'Mafia' : 'Not mentioned')}`,
          `⦿ **Sponsor:** ${sponsor}`,
          `⦿ **Requirement:** ${interaction.options.getString('requirement') || 'No requirement'}`,
          `⦿ **Prize:** ${interaction.options.getString('prize', true)}`
        ];
        const sponsorMessage = interaction.options.getString('message');
        if (sponsorMessage) lines.push(`⦿ **Message:** ${sponsorMessage}`);
        lines.push(`\nMake sure to thank ${sponsor} in <#870240187198885888>`);
        payload.content = `<@&${role}>: New event!`;
        payload.embeds = [new EmbedBuilder().setTitle('Fighthub Event').setColor(Theme.success).setDescription(lines.join('\n').slice(0, 4096))];
      }
      await interaction.channel.send(payload);
      sent = true;
      return await interaction.editReply({ content: 'Pinged!' });
    } catch (error) {
      if (!sent) cooldowns.delete(key);
      throw error;
    }
  }
};
