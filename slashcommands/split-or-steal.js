const { SlashCommandBuilder } = require('@discordjs/builders')
const {
    CommandInteraction,
    MessageEmbed,
    MessageActionRow,
    MessageButton,
} = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('splitorsteal')
        .setDescription('Start a game of split or steal with someone!')
        .addUserOption((option) => {
            return option
                .setName('user1')
                .setDescription('The first user.')
                .setRequired(true)
        })
        .addUserOption((option) => {
            return option
                .setName('user2')
                .setDescription('The second user.')
                .setRequired(true)
        })
        .addStringOption((option) => {
            return option
                .setName('prize')
                .setDescription('The prize for split or steal.')
                .setRequired(true)
        }),
    /**
     * @param {CommandInteraction} interaction
     */
    async execute(interaction) {
        const data = {
            user1: interaction.options.getUser('user1'),
            user2: interaction.options.getUser('user2'),
            prize: interaction.options.getString('prize'),
        }

        const mainEmbed = new MessageEmbed()
            .setTitle('Split or Steal')
            .setDescription(
                'The game will start when both the parties are ready.\nHit **Ready** when you are ready!'
            )
            .setColor('YELLOW')
            .setTimestamp()

        const components = new MessageActionRow().addComponents([
            new MessageButton()
                .setLabel('READY')
                .setStyle('SUCCESS')
                .setCustomId('ready-sos'),
        ])
        const gamedata = {
            user1: {
                user: data.user1,
                ready: false,
                choice: null,
            },
            user2: {
                user: data.user2,
                ready: false,
                choice: null,
            },
        }

        const int = await interaction.reply({
            content: `${data.user1} & ${data.user2}`,
            embeds: [mainEmbed],
            components: [components],
        })

        const readyCollector = int.createMessageComponentCollector({
            time: 30_000,
        })
        /**
         * @param {MessageButton} button
         */
        readyCollector.on('collect', async (button) => {})
    },
}
