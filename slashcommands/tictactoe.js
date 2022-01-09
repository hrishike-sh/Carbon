const { SlashCommandBuilder } = require('@discordjs/builders')
const {
    CommandInteraction,
    MessageButton,
    MessageActionRow,
} = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tictactoe')
        .setDescription('Start a game of tictactoe with someone!')
        .addUserOption((opt) => {
            return opt
                .setName('user')
                .setRequired(true)
                .setDescription('Mention the user you want to fight with.')
        })
        .addBooleanOption((o) => {
            return o
                .setRequired(false)
                .setName('buttons')
                .setDescription('Should the game use buttons? Default: true')
        }),
    /**
     *
     * @param {CommandInteraction} interaction
     */
    async execute(interaction) {
        const data = {
            opponent: interaction.options.getUser('user'),
            buttons: interaction.options.getBoolean('buttons') || null,
        }

        const gamedata = {
            user1: {
                user: interaction.user,
                symbol: 'x',
            },
            user2: {
                user: data.opponent,
                symbol: 'y',
            },
        }

        let gameBoard = {
            a: {
                a1: null,
                a2: null,
                a3: null,
            },
            b: {
                b1: null,
                b2: null,
                b3: null,
            },
            c: {
                c1: null,
                c2: null,
                c3: null,
            },
        }

        const checkWin = (g) => {
            if (
                (g.a.a1 == 'x' && g.a.a2 == 'x' && g.a.a3 == 'x') ||
                (g.b.b1 == 'x' && g.b.b2 == 'x' && g.b.b3 == 'x') ||
                (g.c.c1 == 'x' && g.c.c2 == 'x' && g.c.c3 == 'x') ||
                (g.a.a1 == 'x' && g.b.b1 == 'x' && g.c.c1 == 'x') ||
                (g.a.a2 == 'x' && g.b.b2 == 'x' && g.b.c2 == 'x') ||
                (g.a.a3 == 'x' && g.b.b3 == 'x' && g.b.c3 == 'x') ||
                (g.a.a1 == 'x' && g.b.b2 == 'x' && g.c.c3 == 'x') ||
                (g.a.a3 == 'x' && g.b.b2 == 'x' && g.c.c1 == 'x')
            ) {
                return { win: true, winner: 'x' }
            } else if (
                (g.a.a1 == 'o' && g.a.a2 == 'o' && g.a.a3 == 'o') ||
                (g.b.b1 == 'o' && g.b.b2 == 'o' && g.b.b3 == 'o') ||
                (g.c.c1 == 'o' && g.c.c2 == 'o' && g.c.c3 == 'o') ||
                (g.a.a1 == 'o' && g.b.b1 == 'o' && g.c.c1 == 'o') ||
                (g.a.a2 == 'o' && g.b.b2 == 'o' && g.b.c2 == 'o') ||
                (g.a.a3 == 'o' && g.b.b3 == 'o' && g.b.c3 == 'o') ||
                (g.a.a1 == 'o' && g.b.b2 == 'o' && g.c.c3 == 'o') ||
                (g.a.a3 == 'o' && g.b.b2 == 'o' && g.c.c1 == 'o')
            ) {
                return { win: true, winner: 'o' }
            } else return { win: false }
        }

        let gameRow = [
            new MessageActionRow().addComponents([
                new MessageButton()
                    .setCustomId('a1')
                    .setEmoji('914473340129906708')
                    .setStyle('SECONDARY'),
                new MessageButton()
                    .setCustomId('a2')
                    .setEmoji('914473340129906708')
                    .setStyle('SECONDARY'),
                new MessageButton()
                    .setCustomId('a3')
                    .setEmoji('914473340129906708')
                    .setStyle('SECONDARY'),
            ]),
            new MessageActionRow().addComponents([
                new MessageButton()
                    .setCustomId('b1')
                    .setEmoji('914473340129906708')
                    .setStyle('SECONDARY'),
                new MessageButton()
                    .setCustomId('b2')
                    .setEmoji('914473340129906708')
                    .setStyle('SECONDARY'),
                new MessageButton()
                    .setCustomId('b3')
                    .setEmoji('914473340129906708')
                    .setStyle('SECONDARY'),
            ]),
            new MessageActionRow().addComponents([
                new MessageButton()
                    .setCustomId('c1')
                    .setEmoji('914473340129906708')
                    .setStyle('SECONDARY'),
                new MessageButton()
                    .setCustomId('c2')
                    .setEmoji('914473340129906708')
                    .setStyle('SECONDARY'),
                new MessageButton()
                    .setCustomId('c3')
                    .setEmoji('914473340129906708')
                    .setStyle('SECONDARY'),
            ]),
        ]

        await interaction.reply({
            content: 'Hi',
            components: [gameRow],
        })
    },
}
