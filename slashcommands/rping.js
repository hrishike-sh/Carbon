const { SlashCommandBuilder } = require('@discordjs/builders')
const { CommandInteraction, MessageEmbed } = require('discord.js')
const db = require('../database/models/settingsSchema')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('role-ping')
        .setDescription('Ping a role for giveaway/event/.')
        .addStringOption((opt) => {
            return opt
                .setName('role')
                .setDescription('Choose the ping.')
                .addChoice('Giveaway Ping', '824916330574118942')
                .addChoice('Event Ping', '858088201451995137')
                .addChoice('Mini Gaw and Event Ping', '837121985787592704')
        })
        .addUserOption((opt) => {
            return opt
                .setName('sponsor')
                .setDescription('The sponsor of the event/giveaway.')
                .setRequired(false)
        })
        .addStringOption((opt) => {
            return opt
                .setName('message')
                .setDescription('Message from the sponsor')
                .setRequired(false)
        }),
    category: 'Donation',
    /**
     * @param {CommandInteraction} interaction
     */
    async execute(interaction, client) {
        const modRoles = [
            '824348974449819658',
            '824539655134773269',
            '825783847622934549',
            '858088054942203945',
            '826002228828700718',
        ]
        if (!interaction.member.roles.cache.hasAny(...modRoles)) {
            return interaction.reply({
                content: 'You cannot run this command...',
                ephemeral: true,
            })
        }
        const data = {
            id: interaction.options.getString('role'),
            host: interaction.options.getUser('sponsor') || null,
            message: interaction.options.getString('message') || null,
        }
        let heh
        if (data.id === '824916330574118942') {
            heh = 'gaw'
        } else if (data.id === '858088201451995137') {
            heh = 'event'
        } else {
            heh = 'mini'
        }

        const lastPing = await db.findOne({
            guildID: interaction.guild.id,
        })

        const lastPPing = lastPing.pings[heh]
        const time = new Date().getTime() - lastPPing
        if (time < 3600000) {
            return interaction.reply({
                content: `This ping cannot be pinged as it is on cooldown.\nTry again ${client.functions.formatTime(
                    lastPPing + 3600000
                )}`,
            })
        }

        const embeds = [
            new MessageEmbed()
                .setDescription(
                    `Make sure to thank them in <#870240187198885888>!`
                )
                .setColor('NOT_QUITE_BLACK')
                .setTimestamp(),
        ]
        if (data.host) {
            embeds[0].setDescription(
                embeds[0].description +
                    `\n<:bdash:919555889239822477> Sponsor: ${data.host.toString()}`
            )
        }
        if (data.message) {
            embeds[0].setDescription(
                embeds[0].description +
                    `\n<:bdot:919555960769486890> Message: ${data.message}`
            )
        }

        interaction.reply({
            content: 'Ponged!',
            ephemeral: true,
        })
        lastPing.pings[heh] = new Date().getTime()
        lastPing.save()
    },
}
