const { SlashCommandBuilder } = require('@discordjs/builders')
const { ChannelType } = require('discord-api-types/v9')
const {
    CommandInteraction,
    MessageEmbed,
    MessageActionRow,
    MessageButton,
} = require('discord.js')
const ms = require('ms')
const giveaway = require('../database/models/giveaway')
//
module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway')
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
                    "Add role requirements to the giveaway, add multiple by seperating roles ids with '.'"
                )
        })
        .addUserOption((option) => {
            return option
                .setRequired(false)
                .setName('donator')
                .setDescription(
                    'The person who is donating towards the giveaway'
                )
        })
        .addStringOption((option) => {
            return option
                .setName('message')
                .setDescription('The message from sponsor')
                .setRequired(false)
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
            req: interaction.options.getString('role_requirement') || null,
            donor: interaction.options.getUser('donator') || null,
            message: interaction.options.getString('message') || null,
        }

        let time = data.time
        if (isNaN(ms(time))) {
            return interaction.reply({
                content: `Specify a valid time, I couldn't parse \`${time}\``,
                ephemeral: true,
            })
        }
        time = ms(time)

        const winners = data.winners
        let channel = data.channel
        const donor = data.donor
        let rawQuirement = data.req
        let req = []
        if (rawQuirement) {
            console.log(`1. ${rawQuirement}`)
            rawQuirement = rawQuirement.split('.')
            console.log(`2. ${rawQuirement}`)
            if (Array.isArray(rawQuirement) && rawQuirement.length) {
                for (const r of rawQuirement) {
                    req.push(r)
                }
            } else req = rawQuirement
        } else req = false

        const embed = new MessageEmbed()
            .setTitle(data.prize)
            .setDescription(
                `Use the button to enter!\n**Time**: ${ms(time, {
                    long: true,
                })} (<t:${(
                    (new Date().getTime() + parseInt(time)) /
                    1000
                ).toFixed(0)}:R>)\n**Host**: ${interaction.user.toString()}`
            )
            .setFooter({
                text: `Winners: ${winners}`,
            })
            .setColor('GREEN')
        if (req || req.length)
            embed.addField(
                'Requirements:',
                `Roles: ${req.map((val) => `<@&${val}>`).join(', ')}`,
                false
            )
        if (donor) embed.addField('Donator:', `${donor.toString()}`, false)

        interaction.reply({
            content: `Giveaway started in ${channel}`,
            ephemeral: true,
        })
        const bemBeds = []
        bemBeds.push(embed)
        if (data.message)
            bemBeds.push(
                new MessageEmbed().setDescription(
                    `**Message:** ${data.message}`
                )
            )
        channel = interaction.guild.channels.cache.get(channel.id)
        const row = new MessageActionRow().addComponents([
            new MessageButton()
                .setEmoji('🎉')
                .setCustomId('giveaway-join')
                .setStyle('SUCCESS'),
        ])
        const msg = await channel.send({ embeds: [embed], components: [row] })

        // database
        const dbDat = {
            guildId: interaction.guild.id,
            channelId: channel.id,
            messageId: msg.id,
            hosterId: interaction.user.id,
            winners,
            prize: data.prize,
            endsAt: new Date().getTime() + time,
            hasEnded: false,
            requirements: [],
            entries: [],
        }
        if (req) {
            dbDat.requirements = req
        }

        const dbGaw = new giveaway(dbDat).save()
    },
}
