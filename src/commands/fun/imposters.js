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
            filter: (i) => i.user.id === message.author.id
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
            if (i.customId == 'imposters_start') {
                await i.reply({
                    content: 'Game Started!',
                    ephemeral: true
                });
                SettingsCollector.stop();
            }
        });
        SettingsCollector.on('end', async () => {
            const GameEmbed = new discord_js_1.EmbedBuilder()
                .setTitle(`<:amongus_red:917726679214985246> Imposter Games`)
                .setColor('Yellow')
                .setDescription(`Click the "Join" button to join the game\n\n<:fh_bluedot:1128541545763717173> **Imposters:** ${IMPOSTERS}`)
                .setFooter({
                text: 'Game starts in 30 seconds.'
            });
            const GameRow = new discord_js_1.ActionRowBuilder().addComponents([
                new builders_1.ButtonBuilder()
                    .setLabel('Join')
                    .setStyle(discord_js_1.ButtonStyle.Success)
                    .setCustomId('imposters_join')
            ]);
            const GameJoinMessage = await message.reply({
                embeds: [GameEmbed],
                // @ts-ignore
                components: [GameRow]
            });
            const JoinCollector = GameJoinMessage.createMessageComponentCollector({
                time: 30000
            });
            const PLAYERS = new Map();
            JoinCollector.on('collect', async (joinButton) => {
                // if (joinButton.user.id == message.author.id) {
                //   return joinButton.reply({
                //     content: "You cannot join this game because you're hosting it!",
                //     ephemeral: true
                //   });
                // }
                if (PLAYERS.has(joinButton.user.id)) {
                    PLAYERS.delete(joinButton.user.id);
                    await joinButton.reply({
                        content: 'You left the game!',
                        ephemeral: true
                    });
                    // @ts-ignore
                    GameRow.components[0].setLabel(`Join [${PLAYERS.size}]`);
                    await GameJoinMessage.edit({
                        // @ts-ignore
                        components: [GameRow]
                    });
                }
                else {
                    PLAYERS.set(joinButton.user.id, {
                        imposter: false,
                        user: joinButton.user
                    });
                    await joinButton.reply({
                        content: 'You joined the game!',
                        ephemeral: true
                    });
                    // @ts-ignore
                    GameRow.components[0].setLabel(`Join [${PLAYERS.size}]`);
                    await GameJoinMessage.edit({
                        // @ts-ignore
                        components: [GameRow]
                    });
                }
            });
            JoinCollector.on('end', async () => {
                for (let i = 0; i < IMPOSTERS; i++) {
                    const PLAYERS_ARRAY = Array.from(PLAYERS.values());
                    const imposter = PLAYERS_ARRAY[Math.floor(Math.random() * PLAYERS_ARRAY.length)];
                    imposter.imposter = true;
                }
                for (const [id, player] of PLAYERS) {
                    if (player.imposter) {
                        const imposterEmbed = new discord_js_1.EmbedBuilder()
                            .setTitle("You're an IMPOSTER!!")
                            .setDescription('Your role is to guess the word others are talking about. You get ONE try! If you guess the wrong word, lose the game!')
                            .setColor('Red');
                        await player.user.send({
                            embeds: [imposterEmbed]
                        });
                    }
                    else {
                        const normalEmbed = new discord_js_1.EmbedBuilder().setTitle('Your word is ' + WORD);
                        await player.user.send({
                            embeds: [normalEmbed]
                        });
                    }
                }
            });
        });
    }
};
