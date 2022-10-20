const { SlashCommandBuilder } = require('@discordjs/builders')
const {
    CommandInteraction,
    EmbedBuilder,
    MessageActionRow,
    MessageButton,
} = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('donate')
        .setDescription('Donate for a giveaway or event.')
        .addSubcommand((cmd) => {
            return cmd
                .setName('giveaway')
                .setDescription('Donate towards a giveaway.')
                .addStringOption((opt) => {
                    return opt
                        .setName('time')
                        .setDescription('How long should the givaway last?')
                        .setRequired(true)
                })
                .addStringOption((opt) => {
                    return opt
                        .setName('winners')
                        .setDescription('How many winners?')
                        .setRequired(true)
                })
                .addStringOption((opt) => {
                    return opt
                        .setName('prize')
                        .setDescription('What is the prize of the giveaway?')
                        .setRequired(true)
                })
                .addStringOption((opt) => {
                    return opt
                        .setName('requirements')
                        .setDescription('Requirements for the giveaway.')
                        .setRequired(false)
                })
                .addStringOption((opt) => {
                    return opt
                        .setName('message')
                        .setDescription('Any message?')
                        .setRequired(false)
                })
        })
        .addSubcommand((cmd) => {
            return cmd
                .setName('event')
                .setDescription('Donate for an event!')
                .addStringOption((o) => {
                    return o
                        .setName('type')
                        .setDescription(
                            'Type of the event. (Example: Howgay, Rumble etc)'
                        )
                        .setRequired(true)
                })
                .addStringOption((o) => {
                    return o
                        .setName('prize')
                        .setDescription('Prize for the event winner.')
                        .setRequired(true)
                })
                .addStringOption((o) => {
                    return o
                        .setName('requirement')
                        .setDescription('Requirements for event.')
                        .setRequired(false)
                })
                .addStringOption((o) => {
                    return o
                        .setName('message')
                        .setRequired(false)
                        .setDescription('Optional message.')
                })
                .addStringOption((o) => {
                    return o
                        .setName('explain-the-event')
                        .setDescription('Use this if you have an custom event.')
                        .setRequired(false)
                })
        }),
    category: 'Donation',
    /**
     * @param {CommandInteraction} interaction
     */
    async execute(interaction) {
        const type = interaction.options.getSubcommand()
        if (type == 'giveaway') {
            const giveawayRole = '825783847622934549'
            const giveawayChannel = '824319140763795457'
            const data = {
                time: interaction.options.getString('time'),
                winners: interaction.options.getString('winners'),
                prize: interaction.options.getString('prize'),
                requirement:
                    interaction.options.getString('requirements') || null,
                message: interaction.options.getString('message') || null,
            }

            const embed = new EmbedBuilder()
                .setTitle('💵 Donation')
                .setDescription(
                    "Please wait patiently until a Giveaway Manager is here.\nYou will be DM'd when they are ready to take your donation."
                )
                .addField('Prize', data.prize, false)
                .addField('Time', data.time, true)
                .addField('Winners', data.winners, true)
                .setColor('YELLOW')

            if (data.requirement)
                embed.addField('Requirements', data.requirement, true)
            if (data.message) embed.addField('Message', data.message, true)

            if (interaction.channel.id !== giveawayChannel) {
                return interaction.reply(
                    `This can only be used in <#${giveawayChannel}>`
                )
            }

            await interaction.reply({
                content: 'Wait for a giveaway manager...',
                ephemeral: true,
            })
            const mainMessage = await interaction.channel.send({
                content: `<@&${giveawayRole}>, ${interaction.user.toString()} wants to host a giveaway!`,
                embeds: [embed],
                components: [
                    new MessageActionRow().addComponents([
                        new MessageButton()
                            .setCustomId('accept-dono')
                            .setLabel('Accept')
                            .setStyle('SUCCESS'),
                        new MessageButton()
                            .setCustomId('deny-dono')
                            .setLabel('Deny')
                            .setStyle('DANGER'),
                    ]),
                ],
                allowedMentions: { roles: [giveawayRole], parse: ['users'] },
            })

            const collector = mainMessage.createMessageComponentCollector({
                filter: (b) => {
                    if (!b.member.roles.cache.has(giveawayRole)) {
                        return b.reply({
                            content: `You must have the <@&${giveawayRole}> to accept/deny this.`,
                            ephemeral: true,
                        })
                    } else return true
                },
            })
            collector.on('collect', async (button) => {
                button.reply({
                    content: 'The user was DMd about this.',
                    ephemeral: true,
                })
                const accepted = button.customId.includes('accept')
                if (accepted) {
                    collector.stop()
                    interaction.user.send(
                        `A Giveaway Manager has accepted your donation, please check <#${giveawayChannel}>.`
                    )
                    mainMessage.components[0].components
                        .find((b) => b.customId.includes('deny'))
                        .setStyle('SECONDARY')
                    mainMessage.components[0].components.forEach((c) => {
                        c.setDisabled()
                    })
                    embed.setColor('GREEN')
                    return mainMessage.edit({
                        content: `This request was accepted by ${button.user.toString()}!`,
                        embeds: [embed],
                        components: mainMessage.components,
                    })
                } else {
                    collector.stop()
                    interaction.user.send(
                        `Your giveaway request has been cancelled by ${button.user.toString()} in <#${giveawayChannel}>`
                    )
                    mainMessage.components[0].components
                        .find((b) => !b.customId.includes('deny'))
                        .setStyle('SECONDARY')
                    mainMessage.components[0].components.forEach((c) => {
                        c.setDisabled()
                    })
                    embed.setColor('RED')
                    return mainMessage.edit({
                        content: `This request was cancelled by ${button.user.toString()}!`,
                        embeds: [embed],
                        components: mainMessage.components,
                    })
                }
            })
        } else {
            const eventManRole = '858088054942203945'
            const eventChannel = '857223712193511434'

            const data = {
                type: interaction.options.getString('type'),
                prize: interaction.options.getString('prize'),
                req: interaction.options.getString('requirement') || null,
                msg: interaction.options.getString('message') || null,
                explain:
                    interaction.options.getString('explain-the-event') || null,
            }

            if (interaction.channel.id !== eventChannel) {
                return interaction.reply({
                    content: `This can only be used in <#${eventChannel}>`,
                })
            }

            await interaction.reply({
                content: 'Wait for an Event Manager...',
                ephemeral: true,
            })
            const embed = new EmbedBuilder()
                .setTitle('💵 Event Donation')
                .setDescription(
                    "Please wait patiently until an Event Manager is here.\nYou will be DM'd when they are ready to take your donation."
                )
                .addField('Type', data.type, true)
                .addField('Prize', data.prize, true)
                .setColor('YELLOW')
            if (data.req) embed.addField('Requirement: ', data.req, true)
            if (data.msg) embed.addField('Message', data.msg, true)
            if (data.explain)
                embed.addField('Explaination: ', data.explain, true)
            const mainMessage = await interaction.channel.send({
                content: `<@&${eventManRole}>, ${interaction.user.toString()} wants to host an event!`,
                embeds: [embed],
                components: [
                    new MessageActionRow().addComponents([
                        new MessageButton()
                            .setCustomId('accept-dono')
                            .setLabel('Accept')
                            .setStyle('SUCCESS'),
                        new MessageButton()
                            .setCustomId('deny-dono')
                            .setLabel('Deny')
                            .setStyle('DANGER'),
                    ]),
                ],
                allowedMentions: { roles: [eventManRole], parse: ['users'] },
            })

            const collector = mainMessage.createMessageComponentCollector({
                filter: (b) => {
                    if (!b.member.roles.cache.has(eventManRole)) {
                        return b.reply({
                            content: `You must have the <@&${eventManRole}> to accept/deny this.`,
                            ephemeral: true,
                        })
                    } else return true
                },
            })
            collector.on('collect', async (button) => {
                collector.stop()
                button.reply({
                    content: 'The user was DMd about this.',
                    ephemeral: true,
                })
                const accepted = button.customId.includes('accept')
                if (accepted) {
                    collector.stop()
                    interaction.user.send(
                        `An Event Manager has accepted your donation, please check <#${eventChannel}>.`
                    )
                    mainMessage.components[0].components
                        .find((b) => b.customId.includes('deny'))
                        .setStyle('SECONDARY')
                    mainMessage.components[0].components.forEach((c) => {
                        c.setDisabled()
                    })
                    embed.setColor('GREEN')
                    return mainMessage.edit({
                        content: `This request was accepted by ${button.user.toString()}!`,
                        embeds: [embed],
                        components: mainMessage.components,
                    })
                } else {
                    collector.stop()
                    interaction.user.send(
                        `Your event request has been cancelled by ${button.user.toString()} in <#${eventChannel}>`
                    )
                    mainMessage.components[0].components
                        .find((b) => !b.customId.includes('deny'))
                        .setStyle('SECONDARY')
                    mainMessage.components[0].components.forEach((c) => {
                        c.setDisabled()
                    })
                    embed.setColor('RED')
                    return mainMessage.edit({
                        content: `This request was cancelled by ${button.user.toString()}!`,
                        embeds: [embed],
                        components: mainMessage.components,
                    })
                }
            })
        }
    },
}
