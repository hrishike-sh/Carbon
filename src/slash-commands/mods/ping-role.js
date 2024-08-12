const {
  SlashCommandBuilder,
  Client,
  CommandInteraction,
  EmbedBuilder
} = require('discord.js');

const cooldowns = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pingrole')
    .setDescription('Ping roles!')
    .addStringOption((str) => {
      return str
        .setName('role')
        .setDescription('Ping Cooldown: 30 minutes / role')
        .addChoices(
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
          },
          {
            name: 'Mafia Ping',
            value: '1154432845318721607'
          }
        )
        .setRequired(true);
    })
    .addStringOption((str) => {
      return str
        .setName('prize')
        .setDescription('Prize of the event.')
        .setRequired(true);
    })
    .addUserOption((u) => {
      return u
        .setName('sponsor')
        .setDescription('Sponsor of the giveaway/event')
        .setRequired(true);
    })
    .addStringOption((str) => {
      return str
        .setName('requirement')
        .setDescription('Requirement for the event (dont mention for giveaway)')
        .setRequired(false);
    })
    .addStringOption((msg) => {
      return msg
        .setName('message')
        .setDescription('Message from the sponsor.')
        .setRequired(false);
    })
    .addStringOption((event) => {
      return event
        .setName('event-type')
        .setDescription('Type of the event. (rumble, bo3 kick etc.)')
        .setRequired(false);
    })
    .addBooleanOption((b) => {
      return b
        .setName('event')
        .setDescription('Is it an event?')
        .setRequired(false);
    }),
  /**
   *
   * @param {CommandInteraction} interaction
   * @param {Client} client
   */
  async execute(interaction, client) {
    const member = interaction.member;

    const roles = [
      '824348974449819658', // admin
      '1016728636365209631', // cman
      '824539655134773269', // mod
      '858088054942203945', // giveaway manager
      '858088054942203945' // event manager
    ];

    // if (!member.roles.cache.hasAny(...roles)) {
    //   return interaction.reply("You can't run this command!");
    // } else {
    //   return interaction.reply('You can run this command!');
    // }

    const data = {
      sponsor: interaction.options.get('sponsor'),
      role: interaction.options.get('role'),
      prize: interaction.options.get('prize'),
      requirement: interaction.options.get('requirement'),
      message: interaction.options.get('message'),
      eventType: interaction.options.get('event-type'),
      event: interaction.options.get('event')
    };

    if (data.role.value == '824916330574118942') {
      // giveaway ping

      if (interaction.channel.id !== '826065190973210634') {
        return interaction.reply({
          ephemeral: true,
          content: 'You can only run this command in <#826065190973210634>'
        });
      }
      if (interaction.user.id != '598918643727990784')
        return interaction.reply('Testing only!');
      if (cooldowns.get('giveaway')) {
        const date = cooldowns.get('giveaway');
        if (Date.now() < date) {
          return interaction.reply({
            ephemeral: true,
            content: `This command is on cooldown! Try again <t:${Math.floor(
              date / 1000
            )}:R>`
          });
        }
      }
      cooldowns.set('giveaway', Date.now() + 1800000);

      interaction.reply({
        content: 'Pinged!',
        ephemeral: true
      });

      await interaction.channel.send({
        content: `<@&${
          data.role.value
        }>: Make sure to thank ${data.sponsor.user.toString()} in <#870240187198885888>!`
      });
    } else if (data.role.value == '858088201451995137') {
      // event ping
    } else if (data.role.value == '837121985787592704') {
      // mini gaw and event ping

      // if (
      //   interaction.channel.id !== '826065190973210634' ||
      //   interaction.channel.id != '853280287777882142'
      // ) {
      //   return interaction.reply({
      //     ephemeral: true,
      //     content:
      //       'You can only run this command in <#826065190973210634> and <#853280287777882142>'
      //   });
      }
      if (cooldowns.get('mgaw')) {
        const date = cooldowns.get('mgaw');
        if (Date.now() < date) {
          return interaction.reply({
            ephemeral: true,
            content: `This command is on cooldown! Try again <t:${Math.floor(
              date / 1000
            )}:R>`
          });
        }
      }
      cooldowns.set('mgaw', Date.now() + 1800000);

      interaction.reply({
        content: 'Pinged!',
        ephemeral: true
      });

      if (data.event.value) {
        const embed = new EmbedBuilder()
          .setTitle('Event')
          .setColor('#9BFA8D')
          .setDescription(
            `\n⦿ **Event**: ${
              data.eventType.value
            }\n⦿ **Sponsor:** ${data.sponsor.member.toString()}\n⦿ **Requirement:** ${
              data.requirement.value || 'No requirement'
            }⦿ **Prize:** ${data.prize.value}\n`
          );
        if (data.message) {
          embed.setDescription(embed.data.description + '⦿ **Prize:**');
        }

        return interaction.channel.send({
          embeds: [embed]
        });
      } else {
        await interaction.channel.send({
          content: `<@&${
            data.role.value
          }>: Make sure to thank ${data.sponsor.user.toString()} in <#870240187198885888>!`
        });
      }
    } else if (data.role.value == '1154432845318721607') {
      // mafia ping
    }
  }
};