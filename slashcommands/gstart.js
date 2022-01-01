const { SlashCommandBuilder } = require('@discordjs/builders')
const { ChannelType } = require('discord-api-types')
const { CommandInteraction } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gstart')
        .setDescription('Start a giveaway!')
        .addStringOption((option) => {
            return option
                .setName('time')
                .setDescription('Specify how long the giveaway should last')
                .setRequired(true)
        })
        .addNumberOption((option) => {
            return option
                .setName('winners')
                .setDescription('Specify the amount of winners')
                .setRequired(true)
        })
        .addStringOption((option) => {
            return option
                .setName('prize')
                .setDescription('Specify the prize for the giveaway')
                .setRequired(true)
        })
        .addChannelOption((option) => {
            return option
                .setName('channel')
                .setDescription(
                    'Mention the channel you want the giveaway to be in.'
                )
                .setRequired(true)
                .addChannelType(ChannelType.GuildText)
        })
        .addStringOption((option) => {
            return option
                .setRequired(false)
                .setName('role_requirement')
                .setDescription(
                    "Add role requirements to the giveaway, add multiple by seperating roles ids with ' '"
                )
        })
        .addUserOption((option) => {
            return option
                .setRequired(false)
                .setName('donator')
                .setDescription(
                    'The person who is donating towards the giveaway'
                )
        }),

    /**
     *
     * @param {CommandInteraction} interaction
     */
    async execute(interaction) {
        const data = {
            prize: interaction.options.getString('prize'),
            winners: interaction.options.getNumber('winners'),
            time: interaction.options.getString('time'),
            channel: interaction.options.getChannel('channel'),
            req: interaction.options.getString('role_requirement'),
            donor: interaction.options.getUser('donator'),
        }

        interaction.reply({
            content: `**Prize**: ${data.prize}\n**Winners**: ${
                data.winners
            }\n**Time**: ${data.time}\n**Roles**: <@${
                data.req
            }>\n**Donator**: ${data.donor.toString()}\n**Channel**: ${data.channel.toString()}`,
        })
    },
}
