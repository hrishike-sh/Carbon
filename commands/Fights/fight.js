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
     * @param {Message} msg
     * @param {Object[]} gamedata
     */
    updateMessage: (msg, gamedata, logs, current) => {
        msg.embeds[0].setColor('RANDOM').setFields([
            {
                name: gamedata[0].user.tag,
                value: `Health: **${gamedata[0].hp}%**`,
                inline: true,
            },
            {
                name: gamedata[1].user.tag,
                value: `Health: **${gamedata[1].hp}%**`,
                inline: true,
            },
            {
                name: 'Last Action',
                value: logs,
                inline: false,
            },
        ])
        msg.edit({
            content: `${current.user.toString()} its your turn!`,
            embeds: msg.embeds,
        })
    },
    /**
     *
     * @param {Message} message
     * @param {String[]} args
     */
    async execute(message, args, client) {
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
            btn.deferUpdate()
            status = 'asdkjgnasg'
            collector.stop()
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
                .addField(gamedata[0].user.tag, `Health: **100%**`, true)
                .addField(gamedata[1].user.tag, `Health: **100%**`, true)
                .addField('Last Action', 'The game has started!', false)
                .setColor('RANDOM')
            let logs = []
            const mainMessage = await message.channel.send({
                content: `${current.user.toString()} its your turn!`,
                embeds: [fightEmbed],
                components: [
                    new MessageActionRow().addComponents([
                        new MessageButton()
                            .setStyle('PRIMARY')
                            .setCustomId('attack')
                            .setLabel('Attack')
                            .setEmoji('🗡️'),
                        new MessageButton()
                            .setStyle('PRIMARY')
                            .setCustomId('heal')
                            .setLabel('Heal')
                            .setEmoji('❤️'),
                    ]),
                ],
            })
            const mainCollector = mainMessage.createMessageComponentCollector({
                filter: (b) => {
                    if (![target.id, message.author.id].includes(b.user.id)) {
                        return b.reply({
                            content: 'go away this is not your game',
                            ephemeral: true,
                        })
                    } else if (b.user.id !== current.user.id) {
                        return b.reply({
                            content: 'Wait for your turn.',
                            ephemeral: true,
                        })
                    } else return true
                },
                idle: 30 * 1000,
            })
            mainCollector.on('collect', async (button) => {
                const action = button.customId
                const opponent = gamedata.find(
                    (a) => a.user.id !== button.user.id
                )
                if (action === 'attack') {
                    const damage = client.functions.getRandom(
                        CONSTANTS.dmg.min,
                        CONSTANTS.dmg.max
                    )

                    button.deferUpdate()
                    let what = `${current.user.tag} deals ${damage} damage to ${opponent.user.tag}!`
                    logs.push(what)
                    opponent.hp -= damage
                    current = opponent

                    this.updateMessage(mainMessage, gamedata, what, current)
                } else if (action === 'heal') {
                } else;
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
