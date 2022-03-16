const { SlashCommandBuilder } = require('@discordjs/builders')
const {
    CommandInteraction,
    Client,
    MessageEmbed,
    MessageActionRow,
    MessageButton,
} = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wordle')
        .setDescription('Play the famous game of wordle in discord! (5x5)'),
    /**
     *
     * @param {CommandInteraction} interaction
     * @param {Client} client
     */
    async execute(interaction, client) {
        const user = interaction.member

        await interaction.reply({ content: 'Game started', ephemeral: true })

        const embed = new MessageEmbed()
            .setTitle('📕 Wordle')
            .setDescription(
                'World is a word guessing game. You have to guess the correct word in 5 tries or less.'
            )
            .addField(
                'How it works:',
                'You have to type a __5 letter__ word in the chat once you are ready. The bot then edits the message with your word.\nIf the button is disabled, the letter is not in the word.\nIf the button is blurple, the letter is in the word, but not at the right place.\nIf the button is green, the letter is in the word and at correct place.'
            )
            .setFooter({ text: '🤓', iconURL: user.displayAvatarURL() })
            .setColor('ORANGE')

        const componentArray = [
            new MessageActionRow(),
            new MessageActionRow(),
            new MessageActionRow(),
            new MessageActionRow(),
            new MessageActionRow(),
        ]
        for (const row of componentArray) {
            if (row.components.length > 5) continue
            for (let i = 0; i < 5; i++) {
                const id = (Math.random() + 1).toString(36).substring(7)
                row.addComponents([
                    new MessageButton()
                        .setEmoji('914473340129906708')
                        .setStyle('PRIMARY')
                        .setCustomId(id),
                ])
            }
        }
        const Game = await interaction.channel.send({
            content: `<@${user.toString()}>`,
            embeds: [embed],
            components: [...componentArray],
        })
    },
}
