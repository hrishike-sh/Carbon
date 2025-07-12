import { ButtonBuilder } from '@discordjs/builders';
import {
  Client,
  EmbedBuilder,
  Message,
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  TextInputStyle,
  ButtonStyle
} from 'discord.js';

module.exports = {
  name: 'imposters',
  execute: async (message: Message, args: String[], client: Client) => {
    const EVENT_MANAGER = '858088054942203945';
    if (!message.member?.roles.cache.has(EVENT_MANAGER)) return;
    if (message.author.id !== '598918643727990784') return;
    const askEmbed = new EmbedBuilder()
      .setTitle('<:amongus_red:917726679214985246> Imposter Game')
      .setColor('Red')
      .setDescription(
        `<:fh_bluedot:1128541545763717173> Imposters: Please select\n<:fh_bluedot:1128541545763717173> Word: Please select\n\n*Click the Start button to start the game.*`
      )
      .setTimestamp();

    const modal = new ModalBuilder()
      .setCustomId('imposters_setup')
      .addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents([
          new TextInputBuilder()
            .setCustomId('imposters_count')
            .setLabel('Imposters')
            .setStyle(TextInputStyle.Short)
            .setMinLength(1)
            .setMaxLength(2)
            .setRequired(true)
        ]),
        new ActionRowBuilder<TextInputBuilder>().addComponents([
          new TextInputBuilder()
            .setCustomId('word')
            .setLabel('Word')
            .setStyle(TextInputStyle.Short)
            .setMinLength(1)
            .setMaxLength(20)
            .setRequired(true)
        ])
      );

    const row = new ActionRowBuilder().addComponents([
      new ButtonBuilder()
        .setLabel('Settings')
        .setCustomId('imposters_settings')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setLabel('Start')
        .setCustomId('imposters_start')
        .setStyle(ButtonStyle.Success)
        .setDisabled(true)
    ]);

    const SettingsMessage = await message.reply({
      embeds: [askEmbed],
      // @ts-ignore
      components: [row],
      fetchReply: true
    });
  }
};
