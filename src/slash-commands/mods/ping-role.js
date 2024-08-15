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
    .addBooleanOption((b) => {
      return b
        .setName('event')
        .setDescription('Is it an event?')
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

    if (!member.roles.cache.hasAny(...roles)) {
      return interaction.reply("You can't use this!");
    }

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

      if (cooldowns.get('giveaway')) {
        const date = cooldowns.get('giveaway');
        if (Date.now() < date) {
          return interaction.reply({
            ephemeral: true,
            content: `This ping is on cooldown! Try again <t:${Math.floor(
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

      if (interaction.channel.id !== '853280287777882142') {
        return interaction.reply({
          ephemeral: true,
          content: 'You can only run this command in <#853280287777882142>'
        });
      }

      if (cooldowns.get('event')) {
        const date = cooldowns.get('event');
        if (Date.now() < date) {
          return interaction.reply({
            ephemeral: true,
            content: `This ping is on cooldown! Try again <t:${Math.floor(
              date / 1000
            )}:R>`
          });
        }
      }
      cooldowns.set('event', Date.now() + 1800000);

      const embed = new EmbedBuilder()
        .setTitle('Fighthub Event')
        .setDescription(
          `\n\n⦿ **Event**: ${
            data.eventType?.value || 'Not mentioned'
          }\n⦿ **Sponsor:** ${data.sponsor.member.toString()}\n⦿ **Requirement:** ${
            data.requirement?.value || 'No requirement'
          }\n⦿ **Prize:** ${data.prize?.value}\n`
        )
        .setThumbnail(
          'https://media.discordapp.net/attachments/841358137398788096/894574822699434014/image0.png?ex=66bab4fa&is=66b9637a&hm=4a05904925b15517a7cc27de29118209f7147b95debe11a511208cace67f1528&'
        )
        .setColor('#9BFA8D');

      if (data.message) {
        embed.setDescription(
          embed.data.description + '⦿ **Message:**' + data.message.value + '\n'
        );
      }

      embed.setDescription(
        embed.data.description +
          `\nMake sure to thank ${data.sponsor.user.toString()} in <#870240187198885888>`
      );
      interaction.reply({
        content: 'Pinged!',
        ephemeral: true
      });

      await interaction.channel.send({
        embeds: [embed],
        content: `<@&${data.role.value}>: New event!`
      });
    } else if (data.role.value == '837121985787592704') {
      // mini gaw and event ping

      if (
        interaction.channel.id !== '826065190973210634' &&
        interaction.channel.id !== '853280287777882142'
      ) {
        return interaction.reply({
          ephemeral: true,
          content:
            'You can only run this command in <#826065190973210634> and <#853280287777882142>'
        });
      }
      if (cooldowns.get('mgaw')) {
        const date = cooldowns.get('mgaw');
        if (Date.now() < date) {
          return interaction.reply({
            ephemeral: true,
            content: `This ping is on cooldown! Try again <t:${Math.floor(
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
          .setTitle('Fighthub Event!')
          .setColor('#9BFA8D')
          .setDescription(
            `\n\n⦿ **Event**: ${
              data.eventType?.value || 'Not mentioned'
            }\n⦿ **Sponsor:** ${data.sponsor.member.toString()}\n⦿ **Requirement:** ${
              data.requirement?.value || 'No requirement'
            }\n⦿ **Prize:** ${data.prize?.value}\n`
          )
          .setThumbnail(
            'https://media.discordapp.net/attachments/841358137398788096/894574822699434014/image0.png?ex=66bab4fa&is=66b9637a&hm=4a05904925b15517a7cc27de29118209f7147b95debe11a511208cace67f1528&'
          );
        if (data.message) {
          embed.setDescription(
            embed.data.description +
              '⦿ **Message:**' +
              data.message.value +
              '\n'
          );
        }

        embed.setDescription(
          embed.data.description +
            `\nMake sure to thank ${data.sponsor.user.toString()} in <#870240187198885888>`
        );

        return interaction.channel.send({
          embeds: [embed],
          content: `<@&${data.role.value}>: New event!`
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
