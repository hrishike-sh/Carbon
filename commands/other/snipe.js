const {
    MessageEmbed,
    Client,
    Message,
    MessageButton,
    MessageActionRow,
} = require('discord.js')
const settings = require('../../database/models/settingsSchema')

module.exports = {
    name: 'snipe',
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
        // const guild = await settings.findOne({ guildID: message.guild.id }) || null

        // if(guild.snipes == false) return message.channel.send(`This server has snipes disabled!`)
        if (message.guild.id === client.config.guildId) {
            if (
                !message.member.roles.cache.some(
                    (role) => role.id === '839803117646512128'
                ) &&
                !message.member.roles.cache.some(
                    (role) => role.id === '826196972167757875'
                ) &&
                !message.member.roles.cache.some(
                    (role) => role.id === '825283097830096908'
                ) &&
                !message.member.roles.cache.some(
                    (role) => role.id === '824687393868742696'
                ) && 
                !message.member.roles.cache.some(
                    (role) => role.id === '828048225096826890'
                ) && 
                !message.member.roles.cache.some(
                    (role) => role.id === '824348974449819658'
                )
            )
             {
                return message.channel.send(
                    'You do not have permission to use this command, read <#843943148945276949> for more info.'
                )
            }
        }
        if (!sniped || sniped == undefined) {
            message.channel.send('There is nothing to snipe!')
            return
        }

        let snipe = +args[0] - 1 || 0

        let target = sniped[snipe]

        let { msg, time, image } = target

        let snipeBed = new MessageEmbed()
            .setAuthor({
                name: msg.author.tag,
                iconURL: msg.author.displayAvatarURL() || null,
            })
            .setDescription(msg.content)
            .setColor('RANDOM')
            .setFooter(`${snipe + 1}/${sniped.length}`)
            .setImage(image)
            .setTimestamp(time)
        let prevBut = new MessageButton()
            .setEmoji('911971090954326017')
            .setCustomId('prev-snipe')
            .setStyle('SUCCESS')
        let nextBut = new MessageButton()
            .setEmoji('911971202048864267')
            .setCustomId('next-snipe')
            .setStyle('SUCCESS')
        let row = new MessageActionRow().addComponents([prevBut, nextBut])

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
                snipeBed = new MessageEmbed()
                    .setAuthor({
                        name: msg.author.tag,
                        iconURL: msg.author.displayAvatarURL() || null,
                    })
                    .setDescription(msg.content)
                    .setColor('RANDOM')
                    .setFooter(`${snipe + 1}/${sniped.length}`)
                    .setImage(image)
                    .setTimestamp(time)

                return mainMessage.edit({
                    content: 'Use the buttons to navigate.',
                    embeds: [snipeBed],
                    components: [row],
                })
            } else {
                snipe++
                if (snipe > sniped.length || snipe == sniped.length) {
                    snipe = sniped.length - 1
                }
                target = sniped[snipe]
                let { msg, time, image } = target
                snipeBed = new MessageEmbed()
                    .setAuthor({
                        name: msg.author.tag,
                        iconURL: msg.author.displayAvatarURL() || null,
                    })
                    .setDescription(msg.content)
                    .setColor('RANDOM')
                    .setFooter(`${snipe + 1}/${sniped.length}`)
                    .setImage(image)
                    .setTimestamp(time)

                return mainMessage.edit({
                    content: 'Use the buttons to navigate.',
                    embeds: [snipeBed],
                    components: [row],
                })
            }
        })

        collector.on('end', () => {
            prevBut = prevBut.setDisabled()
            nextBut = nextBut.setDisabled()
            row = new MessageActionRow().addComponents([prevBut, nextBut])
            target = sniped[snipe]
            let { msg, time, image } = target
            snipeBed = new MessageEmbed()
                .setAuthor({
                    name: msg.author.tag,
                    iconURL: msg.author.displayAvatarURL() || null,
                })
                .setDescription(msg.content)
                .setColor('RANDOM')
                .setFooter(`${snipe + 1}/${sniped.length}`)
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
