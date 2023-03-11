const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
  } = require('discord.js');

    module.exports = {
    name: 'howgay',
    category: 'Fights',
    args: true,
    usage: '<user> <high / low>',
    description: 'Dank Memer\'s howgay fighthub method, but its automatic!',
    /**
     * @param {Message} message
     * @param {String[]} args
     * @param {Client} client
     */
    async execute(message, args, client) {
        const target = message.mentions?.users?.first() || null;

        if (!target) {
        return message.channel.send('You must ping someone to play with them!');
        }

        const getRate = () => Math.floor(Math.random() * 101);

        let gamedata = {
        players: {
            one: message.member,
            two: message.mentions.members.first(),
            oneR: getRate(),
            twoR: getRate(),
        },
        };
        args.shift();

        const type = args[0]?.toLocaleLowerCase() || null;

        if (!type || !['low', 'high', 'l', 'h'].includes(type)) {
        return message.reply(`You must specify the type of fight! Either HIGH or LOW (high/low/h/l).`);
        }

        gamedata.type = type.includes('h') ? 'high' : 'low';

        const confirmationMessage = await message.channel.send({
        content: `${target.toString()} do you want to play a game of HowGay with ${message.author.toString()}?`,
        embeds: [
            {
            title: `Confirmation | ${target.username}`,
            description: 'Use the button to make your choice.\nYou have 30 seconds...',
            color: `16776960`,
            },
        ],
        components: [
            new ActionRowBuilder().addComponents([
                new ButtonBuilder()
                  .setLabel('Accept')
                  .setStyle(ButtonStyle.Success)
                  .setCustomId('accept-hg'),
                new ButtonBuilder()
                  .setLabel('Deny')
                  .setStyle(ButtonStyle.Danger)
                  .setCustomId('deny-hg'),
              ]),
            ],   
        });

        const collector = confirmationMessage.createMessageComponentCollector({
        time: 30 * 1000,
        });

        collector.on('collect', async (button) => {
        if (button.user.id !== target.id) {
            return button.reply({
            content: ':warning: This is not for you idiot.',
            ephemeral: true,
            });
        }

        if (button.customId.includes('accept')) {
            confirmationMessage.edit({
            embeds: [],
            content: 'This request was ACCEPTED.',
            components: [],
            });

            const mainMessage = await message.channel.send({
            embeds: [
                {
                title: 'Starting game....',
                color: '65280',
                },
            ],
            });

            await new Promise(resolve => setTimeout(resolve, 5000));

            const embed = new EmbedBuilder()
            .setTitle(`Howgay | ${target.tag} VS ${message.author.tag}`)
            .setDescription(`The one with the ${gamedata.type == 'high' ? '**highest**' : '**lowest**'} rate wins!`)
            .addFields(
                {
                name: `${gamedata.players.one.user.tag}`,
                value: `Rate: ${gamedata.players.oneR}`,
                inline: true,
                },
                {
                name: `${gamedata.players.two.user.tag}`,
                value: `Rate: ${gamedata.players.twoR}`,
                inline: true,
                }
            )
            .setColor('65280')
        
            let winners = [];

            winnerCollector.on('collect', (reaction, user) => {
            winners.push(user.id);
            });

            winnerCollector.on('end', async (collected) => {
            const userWins = winners.filter((id) => gamedata.players.one.user.id === id).length;
            const targetWins = winners.filter((id) => gamedata.players.two.user.id === id).length;

            if (userWins === targetWins) {
                await sentMessage.edit({
                embeds: [
                    embed.setDescription('It was a tie!')
                    .setColor('65280')
                    .setFooter({
                        text: 'Better luck next time!'
                })],
                });
            } else if (userWins > targetWins) {
                await sentMessage.edit({
                embeds: [
                    embed.setDescription(`${gamedata.players.one.user.tag} won with ${gamedata.players.oneR} points!`)
                    .setColor('65280')
                    .setFooter({
                        text: "Congratulations ${gamedata.players.one.user.tag}!"
                    })
                ],
                });
            } else {
                await sentMessage.edit({
                embeds: [
                    embed.setDescription(`${gamedata.players.two.user.tag} won with ${gamedata.players.twoR} points!`)
                    .setColor('65280')
                    .setFooter({
                        text: 'Congratulations ${gamedata.players.two.user.tag}!'
                })
                ],
                });
            }
            });
        } else {
            confirmationMessage.edit({
            embeds: [],
            content: 'This request was DENIED.',
            components: [],
            });
        }
        });

        collector.on('end', async (collected) => {
        confirmationMessage.edit({
            embeds: [],
            content: 'Time\'s up!',
            components: [],
        });
        });
    },
    };

