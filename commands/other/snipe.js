const {
    EmbedBuilder,
    Client,
    Message,
    ButtonBuilder,
    ActionRowBuilder,
    ButtonStyle,
} = require('discord.js')
const settings = require('../../database/models/settingsSchema')

module.exports = {
    name: 'snipe',
    category: 'Fun',
    description: 'get sniped lol',
    disabledChannels: ['874330931752730674'],
    /**
     *
     * @param {Message} message
     * @param {String[]} args
     * @param {Client} client
     * @returns
     */
    async execute(message, args, client) {
        const sniped = client.snipes.snipes.get(message.channel.id)
        const server = await settings.findOne({
            guildID: message.guild.id,
        })

        if (!server || !server.snipe_config?.allowed_roles.length) {
            return message.reply(
                'This server has not yet setup the Snipe Feature.\nPlease ask an admin to run `/snipe-config` to set it up. If you cant see the slash commands please reinvite the bot using `fh invite`.'
            )
        }

        if (!server.snipe_config.enabled) {
            return message.reply(
                'Snipes are disabled in this server! (/snipe-config)'
            )
        }

        if (
            server.snipe_config.allowed_roles.length &&
            !message.member.roles.cache.hasAny(
                ...server.snipe_config.allowed_roles
            )
        ) {
            return message.reply({
                embeds: [
                    {
                        title: 'No permission!',
                        description:
                            'You need to have one of the following roles to use this command:' +
                            `\n${server.snipe_config.allowed_roles
                                .map(
                                    (a) => `<:bdash:919555889239822477><@&${a}>`
                                )
                                .join('\n')}`,
                        color: 'Red',
                    },
                ],
            })
        }

        if (!sniped || sniped == undefined) {
            message.channel.send('There is nothing to snipe!')
            return
        }

        let snipe = +args[0] - 1 || 0

        let target = sniped[snipe]

        let { msg, time, image } = target

        let snipeBed = new EmbedBuilder()
            .setAuthor({
                name: msg.author.tag,
                iconURL: msg.author.displayAvatarURL() || null,
            })
            .setDescription(msg.content)
            .setColor('Random')
            .setFooter({ text: `${snipe + 1}/${sniped.length}` })
            .setImage(image)
            .setTimestamp(time)
        let prevBut = new ButtonBuilder()
            .setEmoji('911971090954326017')
            .setCustomId('prev-snipe')
            .setStyle(ButtonStyle.Success)
        let delBut = new ButtonBuilder()
            .setEmoji('🗑')
            .setCustomId('del-snipe')
            .setStyle(ButtonStyle.Primary)
        let nextBut = new ButtonBuilder()
            .setEmoji('911971202048864267')
            .setCustomId('next-snipe')
            .setStyle(ButtonStyle.Success)
        let row = new ActionRowBuilder().addComponents([
            prevBut,
            delBut,
            nextBut,
        ])

        const mainMessage = await message.channel.send({
            content: 'Use the buttons to navigate.',
            embeds: [snipeBed],
            components: [row],
        })

        const collector = mainMessage.createMessageComponentCollector({
            time: 30000,
        })

        collector.on('collect', async (button) => {
            if (button.user.id !== message.author.id) {
                return button.reply({
                    ephemeral: true,
                    content: 'This is not for you',
                })
            }
            const id = button.customId
            button.deferUpdate()
            if (id === 'prev-snipe') {
                snipe--
                if (snipe < 0) {
                    snipe = 0
                }
                target = sniped[snipe]
                let { msg, time, image } = target
                snipeBed = new EmbedBuilder()
                    .setAuthor({
                        name: msg.author.tag,
                        iconURL: msg.author.displayAvatarURL() || null,
                    })
                    .setDescription(msg.content)
                    .setColor('Random')
                    .setFooter({ text: `${snipe + 1}/${sniped.length}` })
                    .setImage(image)
                    .setTimestamp(time)

                return mainMessage.edit({
                    content: 'Use the buttons to navigate.',
                    embeds: [snipeBed],
                    components: [row],
                })
            } else if (id === 'next-snipe') {
                snipe++
                if (snipe > sniped.length || snipe == sniped.length) {
                    snipe = sniped.length - 1
                }
                target = sniped[snipe]
                let { msg, time, image } = target
                snipeBed = new EmbedBuilder()
                    .setAuthor({
                        name: msg.author.tag,
                        iconURL: msg.author.displayAvatarURL() || null,
                    })
                    .setDescription(msg.content)
                    .setColor('Random')
                    .setFooter({ text: `${snipe + 1}/${sniped.length}` })
                    .setImage(image)
                    .setTimestamp(time)

                return mainMessage.edit({
                    content: 'Use the buttons to navigate.',
                    embeds: [snipeBed],
                    components: [row],
                })
            } else {
                mainMessage.delete()
            }
        })

        collector.on('end', () => {
            prevBut = prevBut.setDisabled()
            nextBut = nextBut.setDisabled()
            row = new ActionRowBuilder().addComponents([prevBut, nextBut])
            target = sniped[snipe]
            let { msg, time, image } = target
            snipeBed = new EmbedBuilder()
                .setAuthor({
                    name: msg.author.tag,
                    iconURL: msg.author.displayAvatarURL() || null,
                })
                .setDescription(msg.content)
                .setColor('Random')
                .setFooter({ text: `${snipe + 1}/${sniped.length}` })
                .setImage(image)
                .setTimestamp(time)
            try {
                mainMessage.edit({
                    content: 'Use the buttons to navigate.',
                    embeds: [snipeBed],
                    components: [row],
                })
            } catch (e) {}
        })
    },
}
