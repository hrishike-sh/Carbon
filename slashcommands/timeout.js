const { SlashCommandBuilder } = require('@discordjs/builders')
const { CommandInteraction, EmbedBuilder } = require('discord.js')
const ms = require('ms')
module.exports = {
    category: 'Utility',
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Time someone out.')
        .addUserOption((amogus) => {
            return amogus
                .setName('user')
                .setDescription('The user you want to timeout.')
                .setRequired(true)
        })
        .addStringOption((red) => {
            return red
                .setName('time')
                .setDescription(
                    'Specify the amount of time the user should be timed out.'
                )
                .setRequired(true)
        })
        .addStringOption((sus) => {
            return sus
                .setDescription('Reason for the timeout.')
                .setName('reason')
                .setRequired(true)
        }),
    /**
     *
     * @param {CommandInteraction} interaction
     */
    permissions: 'BAN_MEMBERS',
    /**
     *
     * @param {CommandInteraction} interaction
     */
    async execute(interaction) {
        const data = {
            user: interaction.options.getUser('user'),
            time: interaction.options.getString('time'),
            reason: interaction.options.getString('reason'),
        }

        const target = await interaction.guild.members.fetch({
            user: data.user,
        })
        if (!target) {
            return interaction.reply({
                content: `I could not find that user in this guild.`,
                ephemeral: true,
            })
        }

        const time = ms(data.time)
        if (isNaN(time)) {
            return interaction.reply({
                content: `Please provide valid time, could not parse "${data.time}" properly.`,
                ephemeral: true,
            })
        }
        try {
            await target.timeout(time, data.reason.toString())
            interaction.reply({
                content: `${target.toString()} has been timed out for ${ms(
                    time,
                    { long: true }
                )}`,
            })
            try {
                ;(await target.createDM()).send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('Timed out')
                            .setDescription(
                                `You have been timed out in FightHub with the reason: **${
                                    data.reason
                                }**\n\nYour timeout will run out <t:${(
                                    (new Date().getTime() + time) /
                                    1000
                                ).toFixed(0)}:R>`
                            )
                            .setColor('Red')
                            .setTimestamp(),
                    ],
                })
            } catch (e2) {
                return interaction.reply({
                    content: `The user was timed out but I couldn't DM them.\nError: ${e2.message}`,
                })
            }
        } catch (e) {
            return interaction.reply({
                content: `Could not timeout the user.\nError: ${e.message}`,
            })
        }
    },
}
