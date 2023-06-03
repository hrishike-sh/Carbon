const {
  Message,
  Client,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} = require('discord.js');
const PRIMARY = require('../../database/main_dono');
const GRINDER = require('../../database/grinder_dono');
const TICKETS = require('../../database/30k-stuff');
module.exports = {
  name: 'myd',
  aliases: ['mydono', 'mydonation', 'mydonations'],
  cooldown: 2.5,
  /**
   *
   * @param {Message} message
   * @param {[String]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    const target = message.mentions.users?.first() || message.author;

    const filter = {
      userID: target.id,
      guildID: message.guild.id
    };
    const PrimaryDonations = await PRIMARY.findOne(filter);
    const GrinderDonations = await GRINDER.findOne(filter);
    const TicketDonations = await TICKETS.findOne({ userId: target.id });
    if (!PrimaryDonations?.messages && !GrinderDonations?.amount) {
      return message.reply(`${target.toString()} has no donations!`);
    }

    const PrimaryEmbed = new EmbedBuilder()
      .setAuthor({ name: target.tag, iconURL: target.displayAvatarURL() })
      .setTitle('Regular Donations')
      .setDescription(
        `**Coins:** ⏣ ${
          PrimaryDonations?.messages > 0
            ? PrimaryDonations.messages.toLocaleString()
            : 0
        }`
      )
      .setColor('Random')
      .setTimestamp();
    const GrinderEmbed = new EmbedBuilder()
      .setAuthor({ name: target.tag, iconURL: target.displayAvatarURL() })
      .setTitle('Grinder Donations')
      .setDescription(
        `**Coins:** ⏣ ${
          GrinderDonations?.amount > 0
            ? GrinderDonations.amount.toLocaleString()
            : 0
        }`
      )
      .setColor('Random')
      .setTimestamp();
    const TicketEmbed = new EmbedBuilder()
      .setAuthor({ name: target.tag, iconURL: target.displayAvatarURL() })
      .setTitle('Karuta Donations')
      .setDescription(
        `**Tickets:** ⏣=:tickets: ${
          TicketDonations?.tickets > 0
            ? TicketDonations.tickets.toLocaleString()
            : 0
        }`
      )
      .setColor('Random')
      .setTimestamp();

    const PrimaryButton = new ButtonBuilder()
      .setStyle(ButtonStyle.Primary)
      .setCustomId('primary_dono;myd')
      .setLabel('Regular')
      .setDisabled(true);
    const GrinderButton = new ButtonBuilder()
      .setStyle(ButtonStyle.Primary)
      .setCustomId('grinder_dono;myd')
      .setLabel('Grinder');
    const TicketButton = new ButtonBuilder()
      .setStyle(ButtonStyle.Primary)
      .setCustomId('ticket_dono;myd')
      .setLabel('Karuta');
    const row = new ActionRowBuilder().addComponents(
      PrimaryButton,
      GrinderButton,
      TicketButton
    );

    const mainMsg = await message.reply({
      embeds: [PrimaryEmbed],
      components: [row]
    });

    const Collector = mainMsg.createMessageComponentCollector({ idle: 30_000 });

    Collector.on('collect', async (button) => {
      if (button.user.id != message.author.id) {
        return button.reply({
          content: 'This is not your command!',
          ephemeral: true
        });
      }

      if (button.customId == 'primary_dono;myd') {
        PrimaryButton.setDisabled(true);
        GrinderButton.setDisabled(false);
        TicketButton.setDisabled(false);
        button.update({
          embeds: [PrimaryEmbed],
          components: [row]
        });
      } else if (button.customId == 'ticket_dono;myd') {
        PrimaryButton.setDisabled(false);
        GrinderButton.setDisabled(false);
        TicketButton.setDisabled(true);
        button.update({
          embeds: [PrimaryEmbed],
          components: [row]
        });
      } else {
        PrimaryButton.setDisabled(false);
        TicketButton.setDisabled(false);
        GrinderButton.setDisabled(true);

        button.update({
          embeds: [GrinderEmbed],
          components: [row]
        });
      }
    });
    Collector.on('end', () => {
      return mainMsg.edit({
        components: []
      });
    });
  }
};
