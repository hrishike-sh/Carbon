const { SlashCommandBuilder } = require('@discordjs/builders')
const { CommandInteraction } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('memory-game')
        .setDescription(
            'Play a game of memorizing different emojis in discord!'
        ),
    /**
     * @param {CommandInteraction} interaction
     */
    async execute(interaction) {
        const emojis = ['😆', '😀', '😃', '😄', '😁'].sort(
            () => 0.5 - Math.random()
        )
        interaction.reply('The game has started!')
        const message = await interaction.channel.send({
            content:
                '5 random emojis will be displayed one-by-one, you will have to memorize them in order and click the buttons!',
        })
        await sleep(2500)

        for (let i = 0; i < emojis.length; i++) {
            message.edit({
                content: emojis[i],
            })
            await sleep(500)
        }
    },
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}
