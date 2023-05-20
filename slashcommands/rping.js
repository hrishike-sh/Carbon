const {
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder
} = require('discord.js');
const db = require('../database/models/settingsSchema');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('role-ping')
    .setDescription('Ping a role for giveaway/event/.')
    .addStringOption((opt) => {
      return opt
        .setName('role')
        .setDescription('Choose the ping.')
        .addChoices([
          {
            name: 'Giveaway Ping',
            value: '824916330574118942'
          },
          {
            name: 'Event Ping',
            value: '858088201451995137'
          },
          {
            name: 'Mini Gaw and Event Ping',
            value: '837121985787592704'
          }
        ])
        .setRequired(true);
    })
    .addUserOption((opt) => {
      return opt
        .setName('sponsor')
        .setDescription('The sponsor of the event/giveaway.')
        .setRequired(false);
    })
    .addStringOption((opt) => {
      return opt
        .setName('message')
        .setDescription('Message from the sponsor')
        .setRequired(false);
    })
    .addStringOption((opt) => {
      return opt
        .setName('prize')
        .setDescription('Note: USE THIS ONLY FOR EVENTS!!')
        .setRequired(false);
    })
    .addStringOption((opt) => {
      return opt
        .setName('event-type')
        .setDescription('The type of the event(if any).');
    }),
  category: 'Donation',
  /**
   * @param {CommandInteraction} interaction
   */
  async execute(interaction, client) {
    const modRoles = [
      '824348974449819658',
      '824539655134773269',
      '825783847622934549',
      '858088054942203945',
      '826002228828700718'
    ];
    if (!interaction.member.roles.cache.hasAny(...modRoles)) {
      return interaction.reply({
        content: 'You cannot run this command...',
        ephemeral: true
      });
    }
    const data = {
      id: interaction.options.getString('role'),
      host: interaction.options.getUser('sponsor') || null,
      message: interaction.options.getString('message') || null,
      type: interaction.options.getString('event-type') || null,
      prize: interaction.options.getString('prize') || null
    };
    let heh;
    if (data.id === '824916330574118942') {
      heh = 'gaw';
    } else if (data.id === '858088201451995137') {
      heh = 'event';
    } else {
      heh = 'mini';
    }

    const lastPing = await db.findOne({
      guildID: interaction.guild.id
    });

    const lastPPing = lastPing.pings[heh];
    const time = new Date().getTime() - lastPPing;
    if (time < 1800000) {
      return interaction.reply({
        content: `This ping cannot be pinged as it is on cooldown.\nTry again ${client.functions.formatTime(
          lastPPing + 1800000
        )}`
      });
    }

    let embeds = [
      new EmbedBuilder()
        .setDescription(`Make sure to thank them in <#870240187198885888>!`)
        .setColor('NOT_QUITE_BLACK')
        .setTimestamp()
    ];
    if (data.host) {
      embeds[0].setDescription(
        embeds[0].description +
          `\n<:bdash:919555889239822477> Sponsor: ${data.host.toString()}`
      );
    }
    if (data.type) {
      embeds[0].setDescription(
        embeds[0].description +
          `\n<:bdot:919555960769486890> Event type: ${data.type}`
      );
    }
    if (data.prize) {
      embeds[0].setDescription(
        embeds[0].description +
          `\n<:bdot:919555960769486890> Prize: ${data.prize}`
      );
    }
    if (data.message) {
      embeds[0].setDescription(
        embeds[0].description +
          `\n<:bdot:919555960769486890> Message: ${data.message}`
      );
    }
    if (!data.host && !data.message && !data.type) {
      embeds = [];
    }

    interaction.reply({
      content: 'Ponged!',
      ephemeral: true
    });
    lastPing.pings[heh] = new Date().getTime();
    lastPing.save();

    await interaction.channel.send({
      content: `<@&${data.id}>`,
      embeds: embeds.length ? embeds : [],
      allowedMentions: {
        roles: [data.id],
        parse: ['users']
      }
    });
  }
};
