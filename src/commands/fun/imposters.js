"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const builders_1 = require("@discordjs/builders");
const discord_js_1 = require("discord.js");
module.exports = {
    name: 'imposters',
    execute: async (message, args, client) => {
        const EVENT_MANAGER = '858088054942203945';
        let IMPOSTERS = 0;
        let WORD = '';
        if (!message.member?.roles.cache.has(EVENT_MANAGER))
            return;
        if (message.author.id !== '598918643727990784')
            return;
        const askEmbed = new discord_js_1.EmbedBuilder()
            .setTitle('<:amongus_red:917726679214985246> Imposter Game')
            .setColor('Red')
            .setDescription(`<:fh_bluedot:1128541545763717173> Imposters: Please select\n<:fh_bluedot:1128541545763717173> Word: Please select\n\n*Click the Start button to start the game.*`)
            .setTimestamp();
        const modal = new discord_js_1.ModalBuilder()
            .setCustomId('imposters_setup')
            .setTitle('Setup Imposters Game')
            .addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder()
            .setCustomId('imposters_count')
            .setLabel('Imposters')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setMinLength(1)
            .setMaxLength(2)
            .setRequired(true)), new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder()
            .setCustomId('word')
            .setLabel('Word')
            .setStyle(discord_js_1.TextInputStyle.Short)
            .setMinLength(1)
            .setMaxLength(20)
            .setRequired(true)));
        const row = new discord_js_1.ActionRowBuilder().addComponents([
            new builders_1.ButtonBuilder()
                .setLabel('Settings')
                .setCustomId('imposters_settings')
                .setStyle(discord_js_1.ButtonStyle.Primary),
            new builders_1.ButtonBuilder()
                .setLabel('Start')
                .setCustomId('imposters_start')
                .setStyle(discord_js_1.ButtonStyle.Success)
                .setDisabled(true)
        ]);
        const SettingsMessage = await message.reply({
            embeds: [askEmbed],
            // @ts-ignore
            components: [row],
            fetchReply: true
        });
        const SettingsCollector = SettingsMessage.createMessageComponentCollector({
            filter: (i) => i.user.id === message.author.id,
            time: 30000
        });
        SettingsCollector.on('collect', async (i) => {
            if (i.customId == 'imposters_settings') {
                await i.showModal(modal);
                const submitted = await i.awaitModalSubmit({
                    time: 30000,
                    filter: (i) => i.user.id === message.author.id
                });
                await submitted.reply({
                    content: 'Settings Saved!',
                    ephemeral: true
                });
                IMPOSTERS = parseInt(submitted.fields.getTextInputValue('imposters_count'));
                WORD = submitted.fields.getTextInputValue('word');
                askEmbed.setDescription(`<:fh_bluedot:1128541545763717173> Imposters: ${IMPOSTERS}\n<:fh_bluedot:1128541545763717173> Word: :shushing_face:\n\n*Click the Start button to start the game.*`);
                // @ts-ignore
                row.components[1].setDisabled(false);
                await SettingsMessage.edit({
                    embeds: [askEmbed],
                    // @ts-ignore
                    components: [row]
                });
            }
        });
    }
};
