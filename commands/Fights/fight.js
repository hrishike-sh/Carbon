const {
    Message,
    MessageActionRow,
    MessageButton,
    MessageEmbed,
} = require('discord.js')
let fighting = []
module.exports = {
    name: 'fight',
    args: true,
    usage: '<user>',
    category: 'Fights',
    aliases: ['ffight'],
    description: 'Fight someone in the old dank memer style!',
    disabledChannels: ['870240187198885888', '796729013456470036'],
    /**
     *
     * @param {Message} message
     * @param {String[]} args
     */
    async execute(message, args) {
        const CONSTANTS = {
            dmg: {
                max: 40,
                min: 10,
            },
            heal: {
                max: 20,
                min: 10,
            },
        }

        const target = message.mentions.users?.first()
        if (!target)
            return message.reply(`You have to mention someone to fight with.`)

        if (target.bot) return message.reply(`The bot won!`)
        // if (target.id === message.author.id)
        //     return message.reply('The bot does not promote self-harm.')

        const confirMessage = await message.reply({
            content: `${target.toString()} do you accept their challenge?`,
            components: [
                new MessageActionRow().addComponents([
                    new MessageButton()
                        .setCustomId('fight-yes')
                        .setStyle('SUCCESS')
                        .setLabel('Accept'),
                    new MessageButton()
                        .setCustomId('fight-no')
                        .setStyle('DANGER')
                        .setLabel('Deny'),
                ]),
            ],
        })
        const collector = confirMessage.createMessageComponentCollector({
            filter: (b) => {
                if (b.user.id !== target.id) {
                    return b.reply({
                        content: `Only ${target.toString()} can use this interaction!`,
                        ephemeral: true,
                    })
                } else return true
            },
            idle: 15 * 1000,
        })
        let status = 'no response'

        collector.on('collect', async (btn) => {
            if (btn.customId.includes('no')) {
                collector.stop()
                status = 'rejected lol'
                btn.deferUpdate()
                return
            }
            status = 'asdkjgnasg'

            const gamedata = [
                {
                    user: message.author,
                    hp: 100,
                    dead: false,
                },
                {
                    user: target,
                    hp: 100,
                    dead: false,
                },
            ]
            let current = gamedata[Math.floor(Math.random() * 2)]

            const fightEmbed = new MessageEmbed()
                .setTitle('Fight')
                .addField(gamedata[0].user.tag, `Health: **100 %**`, true)
                .addField(gamedata[1].user.tag, `Health: **100 %**`, true)
                .addField('Last Action', 'The game has started!', false)

            const mainMessage = await message.channel.send({
                embeds: [fightEmbed],
            })
        })

        collector.on('end', () => {
            if (status.includes('respon')) {
                confirMessage.components[0].components.forEach((c) =>
                    c.setDisabled()
                )
                confirMessage.edit({
                    content: `~~${confirMessage.content}~~\n\nNo response!`,
                    components: confirMessage.components,
                })
            } else if (status.includes('rejec')) {
                confirMessage.components[0].components.forEach((c) =>
                    c.setDisabled()
                )
                confirMessage.edit({
                    content: `~~${confirMessage.content}~~\n\nThe challenge was denied.`,
                    components: confirMessage.components,
                })
            } else {
                confirMessage.components[0].components.forEach((c) =>
                    c.setDisabled()
                )
                confirMessage.edit({
                    content: `The challenge was accepted.`,
                    components: confirMessage.components,
                })
            }
        })
    },
}
