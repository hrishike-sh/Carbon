const {
  Message,
  Client,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} = require('discord.js');

module.exports = {
  name: 'donate',
  cooldown: 30,
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    const consts = {
      eventChannelId: '857223712193511434',
      giveawayChannelId: '824319140763795457',
      eventManagerRoleId: '858088054942203945',
      giveawayManagerRoleId: '825783847622934549'
    };
    if (
      ![consts.eventChannelId, consts.giveawayChannelId].includes(
        message.channel.id
      )
    ) {
      return message.reply("You can't run this command here.");
    }
    const commandArgs = args.join(' ').split(',');

    if (message.channel.id == consts.eventChannelId) {
      // fh donate <prize>, <requirement>, <event type>, <message>
      const EExample = `**How to use this command. [Events]**\n\n> fh donate <prize>, <requirement>, <event type>, <message>\n  <prize>: Prize for the event winner\n  <requirement>: Pre-requisite for a member to join the event, mention "none" if no requirement.\n  <event type>: Type of event. (example: guessthenumber, tea. rumble etc.)\n  <message>: Optional message you'd like to have.\n\n**Note:** Seperate the arguments using commas.\nExample: fh donate 2 pepetrophies, level 50 & voter, tea, enjoy!`;

      const prize = commandArgs.shift();
      if (!prize) return message.reply(EExample);
      const requirement = commandArgs.shift();
      if (!requirement) return message.reply(EExample);
      const eventType = commandArgs.shift();
      if (!eventType) return message.reply(EExample);
      const msg = commandArgs.shift() || 'None!';

      const EventDonateEmbed = new EmbedBuilder()
        .setTitle('Event Donation')
        .setColor('Blurple')
        .setTimestamp()
        .setFooter({
          text: 'Please be patient, you will receive a DM when an event manager accepts your donation.'
        })
        .setAuthor({
          name: message.author.tag,
          iconURL: message.author.displayAvatarURL()
        })
        .addFields([
          { name: 'Prize', value: prize, inline: true },
          { name: 'Requirement', value: requirement, inline: true },
          { name: 'Type of Event', value: eventType, inline: true },
          { name: 'Message', value: msg, inline: true }
        ]);
      const acceptButton = new ButtonBuilder()
        .setLabel('Accept')
        .setStyle(ButtonStyle.Success)
        .setCustomId('accept;e_dono');
      const denyButton = new ButtonBuilder()
        .setLabel('Deny')
        .setStyle(ButtonStyle.Danger)
        .setCustomId('deny;e_dono');
      const row = new ActionRowBuilder().addComponents([
        acceptButton,
        denyButton
      ]);
      const mainMessage = await message.channel.send({
        content: `<@&${
          consts.eventManagerRoleId
        }>, ${message.author.toString()} would like to make a donation!`,
        embeds: [EventDonateEmbed],
        components: [row]
      });
      const collector = mainMessage.createMessageComponentCollector({});
      collector.on('collect', async (button) => {
        if (!button.member.roles.cache.has(consts.eventManagerRoleId)) {
          return button.reply({
            content: `You need to have the <@&${consts.eventManagerRoleId}> role to accept/deny donations!`,
            ephemeral: true
          });
        }
        collector.stop();

        if (button.customId == 'accept;e_dono') {
          (await message.author.createDM()).send({
            content: `${button.user.toString()} has accepted your Event Donation! Please check <#${
              consts.eventChannelId
            }>`
          });

          return button.reply(
            'The donator has been notified! Please wait for them.'
          );
        } else {
          (await message.author.createDM()).send({
            content: `Your event donation has been denied! Please check <#${consts.eventChannelId}>`
          });

          return button.reply(
            'The donator has been notified! Please wait for them.'
          );
        }
      });
      collector.on('end', () => {
        acceptButton.setDisabled();
        denyButton.setDisabled();

        return mainMessage.edit({
          components: [row]
        });
      });
    } else {
      // fh donate <time>, <winners>, <requirement>, <prize>, <message>
      const GExample = `**How to use this command. [Giveaways]**\n\n> fh donate <time>, <winners>, <requirement>, <prize>, <message>\n  <time>: How long this giveaway should be hosted for.\n  <winners>: Number of winners.\n  <requirement>: Pre-requisite to join the giveaway.\n  <prize>: Prize for the giveaway.\n  <message>: Any message you want, goes below the giveaway.\n\n**Note:** Seperate the arguments using commas.\nExample: fh donate 1 hour, 2 winners, no requirement, 10 Pepe Medals, It's no longer june, yay!`;

      const time = commandArgs.shift();
      if (!time) return message.reply(GExample);
      const winners = commandArgs.shift();
      if (!winners) return message.reply(GExample);
      const requirement = commandArgs.shift();
      if (!requirement) return message.reply(GExample);
      const prize = commandArgs.shift();
      if (!prize) return message.reply(GExample);
      const msgg = commandArgs.shift() || 'None';

      const GiveawayDonateEmbed = new EmbedBuilder()
        .setTitle('Giveaway Donation')
        .setAuthor({
          name: message.author.tag,
          iconURL: message.author.displayAvatarURL()
        })
        .setColor('Blurple')
        .setTimestamp()
        .setFooter({
          text: 'You will receive a DM when a manager accepts your donation. Please be patient!'
        })
        .addFields([
          { name: 'Time', value: time, inline: true },
          { name: 'Winners', value: winners, inline: true },
          { name: 'Requirement', value: requirement, inline: true },
          { name: 'Prize', value: prize, inline: true },
          { name: 'Message', value: msgg, inline: true }
        ]);
      const acceptButton = new ButtonBuilder()
        .setLabel('Accept')
        .setStyle(ButtonStyle.Success)
        .setCustomId('accept;g_dono');
      const denyButton = new ButtonBuilder()
        .setLabel('Deny')
        .setStyle(ButtonStyle.Danger)
        .setCustomId('deny;g_dono');
      const row = new ActionRowBuilder().addComponents([
        acceptButton,
        denyButton
      ]);

      const mainMessage = await message.channel.send({
        content: `<@&${
          consts.giveawayManagerRoleId
        }>, ${message.author.toString()} would like to make a donation!`,
        embeds: [GiveawayDonateEmbed],
        components: [row]
      });
      const collector = mainMessage.createMessageComponentCollector({});
      collector.on('collect', async (button) => {
        if (!button.member.roles.cache.has(consts.giveawayManagerRoleId)) {
          return button.reply({
            content: `You need to have the <@&${consts.giveawayManagerRoleId}> role to accept/deny donations!`,
            ephemeral: true
          });
        }
        collector.stop();

        if (button.customId == 'accept;g_dono') {
          (await message.author.createDM()).send({
            content: `${button.user.toString()} has accepted your Giveaway Donation! Please check <#${
              consts.giveawayChannelId
            }>`
          });

          return button.reply(
            'The donator has been notified! Please wait for them.'
          );
        } else {
          (await message.author.createDM()).send({
            content: `Your event donation has been denied! Please check <#${consts.giveawayChannelId}>`
          });

          return button.reply(
            'The donator has been notified! Please wait for them.'
          );
        }
      });
      collector.on('end', () => {
        acceptButton.setDisabled();
        denyButton.setDisabled();

        return mainMessage.edit({
          components: [row]
        });
      });
    }
  }
};
