"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const builders_1 = require("@discordjs/builders");
const discord_js_1 = require("discord.js");
const { Theme } = require('../../utils/embeds');
module.exports = {
    name: 'imposters',
    execute: async (message, args, client) => {
        const EVENT_MANAGER = config.roles.giveawayManager;
        let IMPOSTERS = 0;
        let WORD = '';
        if (!message.member?.roles.cache.has(EVENT_MANAGER))
            return;
        if (message.author.id !== '598918643727990784')
            return;
        const askEmbed = new discord_js_1.EmbedBuilder()
            .setTitle('<:amongus_red:917726679214985246> Imposter Game')
            .setColor(Theme.error)
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
                .setColor(Theme.warning)
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
                            .setColor(Theme.error);
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
                let go = true;
                while (running) {
                    if (!go)
                        continue;
                    go = false;
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
                    const queue = Array.from(PLAYERS.values())
                        .filter((player) => player.alive)
                        .sort(() => Math.random() - 0.5);
                    const WriteEmbed = new discord_js_1.EmbedBuilder()
                        .setTitle(`Round ${round}`)
                        .setDescription(`Everyone (except the imposter) was sent a word in their DMs! You now have to type a word similar to the one you were given.`)
                        .addFields([
                        {
                            name: 'Waiting for..',
                            value: `<:fh_dotblack:922314907771363419>${queue
                                .map((a) => `<@${a.user.id}>`)
                                .join('\n<:fh_dotblack:922314907771363419>')}`,
                            inline: true
                        },
                        {
                            name: 'Submitted',
                            value: '',
                            inline: true
                        }
                    ])
                        .setColor(Theme.warning)
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
                        components: [WriteRow],
                        content: `<@${queue[0].user.id}> its your turn!`
                    });
                    const WordCollector = WriteMessage.createMessageComponentCollector({});
                    let i = 0;
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
                        const curr = queue[i];
                        if (wordButton.user.id !== curr.user.id) {
                            return wordButton.reply({
                                content: "It's not your turn!",
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
                            i++;
                            return wordButton.followUp({
                                content: 'You did not submit the modal in time.',
                                ephemeral: true
                            });
                        }
                        const word = submitted?.fields?.getTextInputValue('word') || '';
                        if (Words.find((a) => a.word == word)) {
                            i++;
                            return submitted.reply({
                                content: 'Someone else submitted that word! You lost your turn!',
                                ephemeral: true
                            });
                        }
                        else if (word == WORD) {
                            i++;
                            return submitted.reply({
                                content: `You cannot use that word!`,
                                ephemeral: true
                            });
                        }
                        else {
                            Words.find((a) => a.id == wordButton.user.id).word = word;
                        }
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
                        console.log(queue);
                        if (i == queue.length - 1) {
                            WordCollector.stop();
                            await WriteMessage.edit({
                                embeds: [WriteEmbed],
                                content: null
                            });
                        }
                        else {
                            await WriteMessage.edit({
                                embeds: [WriteEmbed],
                                content: `<@${queue[++i].user.id}> its your turn!`
                            });
                        }
                    });
                    WordCollector.on('end', async () => {
                        message.channel.send({
                            embeds: [
                                {
                                    title: "Time's up!",
                                    color: Theme.error
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
                            .setColor(Theme.warning)
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
                                    color: Theme.info
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
                                    color: Theme.error
                                }
                            ]
                        });
                        await sleep(1000);
                        const VoteEmbed = new discord_js_1.EmbedBuilder()
                            .setTitle(`Round ${round} - Voting`)
                            .setDescription(`Everyone, please vote for who you think the imposter is! You have 30 seconds to vote.`)
                            .setColor(Theme.warning)
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
                                    : 'No word submitted'
                            };
                        }));
                        const VoteRow = new discord_js_1.ActionRowBuilder().addComponents([selectmenu]);
                        const voteMessage = await message.channel.send({
                            embeds: [VoteEmbed],
                            // @ts-ignore
                            components: [VoteRow]
                        });
                        const Collector = message.channel.createMessageComponentCollector({
                            filter: (i) => i.customId === 'imposters_vote',
                            time: 30000
                        });
                        const Votes = [];
                        const voted = [];
                        Collector.on('collect', async (i) => {
                            if (!PLAYERS.has(i.user.id)) {
                                return i.reply({
                                    content: 'You are not in the game!',
                                    ephemeral: true
                                });
                            }
                            if (voted.includes(i.user.id)) {
                                return i.reply({
                                    content: 'You have already voted!',
                                    ephemeral: true
                                });
                            }
                            voted.push(i.user.id);
                            const selected = i.values[0];
                            let vote = Votes.find((v) => v.userId === selected);
                            if (!vote) {
                                vote = { userId: selected, voters: [] };
                                Votes.push(vote);
                            }
                            vote.voters.push(i.user.id);
                            const fifty = Math.floor(PLAYERS.size / 2);
                            const fields = [];
                            Votes.forEach((vote) => {
                                const user = client.users.cache.get(vote.userId);
                                if (user) {
                                    fields.push({
                                        name: `${user.username} ${vote.voters.length}/${fifty}`,
                                        value: vote.voters
                                            .map((id) => `<:amongus_red:917726679214985246><@${id}>`)
                                            .join('\n') || 'No votes',
                                        inline: true
                                    });
                                }
                            });
                            VoteEmbed.setFields(fields);
                            voteMessage.edit({
                                embeds: [VoteEmbed]
                            });
                        });
                        Collector.on('end', async () => {
                            const highest = Votes.sort((a, b) => b.voters.length - a.voters.length);
                            if (highest[0] == highest[1]) {
                                // @ts-ignore
                                await message.channel.send({
                                    embeds: [
                                        {
                                            title: 'Tie!',
                                            description: 'There was a tie! No one was eliminated.',
                                            color: Theme.warning
                                        }
                                    ]
                                });
                                go = true;
                                round++;
                            }
                            else {
                                // @ts-ignore
                                await message.channel.send({
                                    content: `<@${highest[0].userId}> was eliminated!`
                                });
                                go = true;
                                round++;
                            }
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
