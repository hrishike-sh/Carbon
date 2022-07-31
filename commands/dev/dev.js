const {
    Message,
    Client,
    MessageEmbed,
    MessageActionRow,
    MessageButton,
} = require('discord.js')
const axios = require('axios')
const { inspect } = require('util')

module.exports = {
    name: 'dev',
    aliases: ['cringe', 'fuck'],
    description: "Unpaid user's favorite command!!",
    /**
     *
     * @param {Message} message
     * @param {String[]} args
     * @param {Client} client
     */
    async execute(message, args, client) {
        if (!client.config.idiots.includes(message.author.id))
            return message.reply(`This command can only be run by idiots!`)

        const subc = ['stats', 'gdump', 'gban', 'gunban']
        const wtf = args[0]?.toLowerCase()
        if (!wtf || !subc.includes(wtf))
            return message.reply(
                `Not a valid sub-command.\nCommands: ${subc.join(', ')}`
            )

        if (wtf == 'stats') {
            let total = {
                users: 0,
                channels: 0,
                roles: 0,
            }
            client.guilds.cache.forEach((guild) => {
                total.users += guild.memberCount
                total.channels += guild.channels.cache.size
                total.roles += guild.roles.cache.size
            })
            const embed = new MessageEmbed()
                .setTitle('Bot Stats')
                .addField(
                    'Up since',
                    `${client.functions.formatTime(client.readyAt)}`,
                    false
                )
                .addField(
                    'Cache',
                    `\`\`\`nim\nUSERS: ${client.users.cache.size.toLocaleString()}\nGUILDS: ${client.guilds.cache.size.toLocaleString()}\nCHANNELS: ${client.channels.cache.size.toLocaleString()}\`\`\``,
                    true
                )
                .addField(
                    'Total',
                    `\`\`\`nim\nUSERS: ${total.users.toLocaleString()}\nCHANNELS: ${total.channels.toLocaleString()}\nROLES: ${total.roles.toLocaleString()}\`\`\``,
                    true
                )
                .setColor('RANDOM')

            await message.reply({
                embeds: [embed],
            })
        } else if (wtf == 'gdump') {
            let data = []
            for (const [id, guild] of client.guilds.cache.sort(
                (a, b) => b.memberCount - a.memberCount
            )) {
                data.push(
                    `> ${guild.name} < (ID: ${guild.id})\n    Members: ${guild.memberCount}\n    Channels: ${guild.channels.cache.size}\n    Roles: ${guild.roles.cache.size}`
                )
            }
            data = data.join('\n')
            const link = await uploadResult(data)

            await message.reply(link)
        } else if (wtf == 'gban') {
            const guilds = client.guilds.cache.filter((a) =>
                a.me.permissions.has('BAN_MEMBERS')
            )
            args.shift()
            if (!args[0])
                return message.reply({
                    embeds: [
                        {
                            title: ':x: Incorrect usage',
                            description: `Please provide the user.\n\nExample: fh dev gban 598918643727990784 test`,
                            color: 'RED',
                        },
                    ],
                })
            let user
            try {
                if (message.mentions.users.size) {
                    user = message.mentions.users.first().id
                } else {
                    user =
                        (
                            await message.guild.members.fetch({
                                query: args[0],
                            })
                        ).first() ||
                        (await client.users.fetch(args[0])) ||
                        null
                }
            } catch (e) {
                return message.reply({
                    embeds: [
                        {
                            title: 'ERROR',
                            color: 'RED',
                            description: `\`\`\`js\n${e.message}\`\`\``,
                        },
                    ],
                })
            }

            if (!user)
                return message.reply(
                    `Could not find/fetch any user with the query \`${args[0]}\``
                )

            args.shift()
            const reason = `Global ban issued by ${message.author.tag}(${
                message.author.id
            }) with reason: ${args?.join(' ') || 'None'}`

            const confirmation = await message.channel.send({
                embeds: [
                    {
                        title: ':warning: Do you want to do this? :warning:',
                        description: `This will ban ${user.toString()} from a total of **${
                            guilds.size
                        }** servers with reason: \`${reason}\`.`,
                        footer: {
                            text: 'Use the buttons to give your response',
                        },
                        color: 'RED',
                    },
                ],
                components: [
                    new MessageActionRow().addComponents([
                        new MessageButton()
                            .setLabel(`Ban ${user.tag}`)
                            .setStyle('DANGER')
                            .setCustomId('gban-yes'),
                        new MessageButton()
                            .setLabel(`Go back`)
                            .setStyle('SUCCESS')
                            .setCustomId('gban-no'),
                    ]),
                ],
            })
            const collector = confirmation.createMessageComponentCollector({
                filter: (b) => {
                    if (b.user.id !== message.author.id) {
                        return b.reply({
                            content: ':clown:',
                            ephemeral: true,
                        })
                    } else return true
                },
            })

            collector.on('collect', async (button) => {
                if (button.customId.includes('no')) {
                    button.message.components[0].components.forEach((c) => {
                        c.setDisabled()
                    })
                    button.message.embeds[0].setTitle('Action Cancelled')
                    button.message.edit({
                        components: button.message.components,
                        embeds: button.message.embeds,
                    })
                    button.reply({
                        content: ':expressionless:',
                        ephemeral: true,
                    })
                    collector.stop()
                } else {
                    collector.stop()
                    let failed = []
                    let success = []
                    guilds.forEach(async (guild) => {
                        await guild.bans
                            .create(user.id, {
                                reason,
                            })
                            .then((b) => {
                                success.push(`Banned from ${guild.name}`)
                            })
                            .catch((e) => {
                                failed.push(
                                    `Failed to ban from: ${guild.name}\nError: ${e.message}`
                                )
                            })
                    })
                    button.message.components[0].components.forEach((c) => {
                        c.setDisabled()
                    })
                    button.message.embeds[0].setTitle('Action Completed')
                    button.message.edit({
                        components: button.message.components,
                        embeds: button.message.embeds,
                    })
                    button.deferUpdate()
                    const embed = new MessageEmbed()
                        .setTitle('Global Ban Info')
                        .setDescription(
                            `${user.toString()} was banned from ${
                                success.length
                            }/${success.length + failed.length} guilds.`
                        )
                        .setColor('YELLOW')
                        .setTimestamp()
                    const successBed = new MessageEmbed()
                        .setDescription(
                            `\`\`\`css\n${success.join('\n')}\`\`\``
                        )
                        .setColor('GREEN')
                    const failBed = new MessageEmbed().setDescription(
                        `\`\`\`css\n${failed.join('\n\n')}\`\`\``
                    )

                    await button.channel.send({
                        embeds: [embed, successBed, failBed],
                    })
                }
            })
        }
    },
}

async function uploadResult(content) {
    const parseQueryString = (obj) => {
        // stole daunt's code 😍
        let res = ''
        for (const key of Object.keys(obj)) {
            res += `${res === '' ? '' : '&'}${key}=${obj[key]}`
        }
        return res
    }
    const res = await axios.post(
        'https://hastepaste.com/api/create',
        parseQueryString({ raw: false, text: encodeURIComponent(content) }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )
    return res.data
}
