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
            // lock channel
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
                        alive: true,
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
                let running = true;
                let round = 1;
                while (running) {
                    running = false;
                    const Words = [];
                    for (const [id, player] of PLAYERS) {
                        if (player.alive) {
                            Words.push({
                                id,
                                word: '',
                                user: player.user
                            });
                        }
                    }
                    const WriteEmbed = new discord_js_1.EmbedBuilder()
                        .setTitle(`Round ${round}`)
                        .setDescription(`Everyone (except the imposter) was sent a word in their DMs! You now have to type a word similar to the one you were given.`)
                        .addFields([
                        {
                            name: 'Waiting for..',
                            value: `<:fh_dotblack:922314907771363419>${Words.map((a) => `<@${a.id}>`).join('\n<:fh_dotblack:922314907771363419>')}`,
                            inline: true
                        },
                        {
                            name: 'Submitted',
                            value: '',
                            inline: true
                        }
                    ])
                        .setColor('Yellow')
                        .setFooter({
                        text: 'Click the button below to submit your word! You have 30 seconds.'
                    });
                    const modal = new discord_js_1.ModalBuilder()
                        .setTitle('Submit your word')
                        .setCustomId('imposters_submit_word')
                        .addComponents(new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.TextInputBuilder()
                        .setCustomId('word')
                        .setLabel('Word')
                        .setStyle(discord_js_1.TextInputStyle.Short)
                        .setMinLength(3)
                        .setMaxLength(20)
                        .setRequired(true)));
                    const WriteRow = new discord_js_1.ActionRowBuilder().addComponents([
                        new builders_1.ButtonBuilder()
                            .setLabel('Submit Word')
                            .setCustomId('imposters_submit_word')
                            .setStyle(discord_js_1.ButtonStyle.Primary)
                    ]);
                    const WriteMessage = await message.reply({
                        embeds: [WriteEmbed],
                        // @ts-ignore
                        components: [WriteRow]
                    });
                    const WordCollector = WriteMessage.createMessageComponentCollector({
                        time: 30000 // THIS
                    });
                    WordCollector.on('collect', async (wordButton) => {
                        if (!PLAYERS.has(wordButton.user.id)) {
                            return wordButton.reply({
                                content: 'You are not in this game.',
                                ephemeral: true
                            });
                        }
                        if (!PLAYERS.get(wordButton.user.id)?.alive) {
                            return wordButton.reply({
                                content: "Dead users can't type!!",
                                ephemeral: true
                            });
                        }
                        await wordButton.showModal(modal);
                        const submitted = await wordButton.awaitModalSubmit({
                            time: 15000,
                            filter: (modalInt) => modalInt.customId === 'imposters_submit_word' &&
                                modalInt.user.id === wordButton.user.id
                        });
                        if (!submitted) {
                            return wordButton.followUp({
                                content: 'You did not submit the modal in time.',
                                ephemeral: true
                            });
                        }
                        const word = submitted.fields.getTextInputValue('word');
                        Words.find((a) => a.id == wordButton.user.id).word = word;
                        await submitted.reply({
                            content: 'Your word has been submitted!',
                            ephemeral: true
                        });
                        WriteEmbed.setFields([
                            {
                                name: 'Waiting for..',
                                value: `<:fh_dotred:1182370172925915156>${Words.filter((a) => a.word.length == 0)
                                    .map((a) => `<@${a.id}>`)
                                    .join('\n<:fh_dotred:1182370172925915156>')}`,
                                inline: true
                            },
                            {
                                name: 'Submitted',
                                value: `<:fh_dotgreen:1176188796249854052>${Words.filter((a) => a.word.length != 0)
                                    .map((a) => `<@${a.id}>: ${a.word}`)
                                    .join('\n<:fh_dotgreen:1176188796249854052>')}`,
                                inline: true
                            }
                        ]);
                        await WriteMessage.edit({
                            embeds: [WriteEmbed]
                        });
                    });
                    WordCollector.on('end', async () => {
                        message.channel.send({
                            embeds: [
                                {
                                    title: "Time's up!",
                                    color: discord_js_1.Colors.Red
                                }
                            ]
                        });
                        const EveryonesEmbed = new discord_js_1.EmbedBuilder()
                            .setTitle(`Round ${round} words`)
                            .setDescription(`The theme was (i havent added this yet xdd)`)
                            .addFields(Words.map((a) => {
                            return {
                                name: `<@${a.user.username}>`,
                                value: a.word || 'No word submitted',
                                inline: true
                            };
                        }))
                            .setColor('Yellow')
                            .setFooter({
                            text: 'The channel will unlock in 10 seconds.'
                        });
                        // @ts-ignore
                        message.channel.send({
                            embeds: [EveryonesEmbed]
                        });
                        await sleep(9000);
                        // @ts-ignore
                        await message.channel.send({
                            embeds: [
                                {
                                    title: 'You have 30 seconds to figure out who the imposter is!',
                                    color: discord_js_1.Colors.Blue
                                }
                            ]
                        });
                        await sleep(1000);
                        // Unlock channel
                        await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                            SendMessages: true
                        });
                        await sleep(30000);
                        // Lock channel again
                        await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
                            SendMessages: false
                        });
                        // @ts-ignore
                        await message.channel.send({
                            embeds: [
                                {
                                    title: "Time's up!",
                                    color: discord_js_1.Colors.Red
                                }
                            ]
                        });
                        await sleep(1000);
                        const VoteEmbed = new discord_js_1.EmbedBuilder()
                            .setTitle(`Round ${round} - Voting`)
                            .setDescription(`Everyone, please vote for who you think the imposter is! You have 30 seconds to vote.`)
                            .setColor('Yellow')
                            .setFooter({
                            text: 'Click the button below to vote!'
                        });
                        const selectmenu = new discord_js_1.StringSelectMenuBuilder()
                            .setCustomId('imposters_vote')
                            .setPlaceholder('Select a player to vote for!')
                            .setMinValues(1)
                            .setMaxValues(1)
                            .addOptions(Words.map((a) => {
                            return {
                                label: a.user.username,
                                value: a.id,
                                description: a.word.length > 0
                                    ? `Their word was: ${a.word}`
                                    : 'No word submitted',
                                emoji: a.user.displayAvatarURL({ size: 32 })
                            };
                        }));
                        const VoteRow = new discord_js_1.ActionRowBuilder().addComponents([selectmenu]);
                        await message.channel.send({
                            embeds: [VoteEmbed],
                            // @ts-ignore
                            components: [VoteRow]
                        });
                    });
                }
            });
        });
    }
};
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
