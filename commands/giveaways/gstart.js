const ms = require('better-ms')
const giveawayModel = require('../../database/models/giveaway')
const {
    Message,
    Client,
    MessageButton,
    MessageActionRow,
    MessageEmbed,
} = require('discord.js')
const server = require('../../database/models/settingsSchema')
const { inspect } = require('util')
module.exports = {
    name: 'gstart',
    alises: ['g', 'giveaway', 'gaw'],
    description: 'start giveaways (testing only)',
    /**
     *
     * @param {Message} message
     * @param {String[]} args
     * @param {Client} client
     */
    async execute(message, args, client) {
        // time winners req prize --tags
        let allowedRoles = []
        const Server = await server.findOne({
            guildID: message.guild.id,
        })
        if (!Server || !Server?.giveaway_config?.manager_roles.length) {
            return message.reply(
                `This server has not yet setup Giveaway Manager! Ask an admin to set them via **/gconfig**.`
            )
        }
        allowedRoles = Server.giveaway_config.manager_roles
        const example = `\n\n\`fh gstart 1h20m 5 roleId1.roleId2 Pepe Trophy each --msg Hrish was here --donor userId\``
        if (!message.member.roles.cache.hasAny(...allowedRoles)) {
            return message.reply({
                embeds: [
                    {
                        title: 'ERROR',
                        description:
                            ':x: Missing Permissions\n\n' +
                            `You need any one of the following roles to run this command: ${allowedRoles
                                .map((r) => `<@&${r}>`)
                                .join(' ')}`,
                        color: 'RED',
                    },
                ],
            })
        }

        if (!args[0]) return message.reply(`Please provide time!${example}`)
        const time = ms.getMilliseconds(args[0])

        if (!time)
            return message.reply(
                `Could not parse \`${args[0]}\` as time.${example}`
            )
        args.shift()
        // winners req prize --tags
        if (!args[0])
            return message.reply(`Please provide number of winners!${example}`)

        if (Number.isNaN(args[0]))
            return message.reply(
                `I don't thing \`${args[0]}\` is a number.${example}`
            )
        const winners = parseInt(args[0])
        args.shift()
        // req prize --tags
        if (!args[0])
            return message.reply(
                `Please provide Requirements or "none"!${example}`
            )
        const rawq = args[0]
        let requirements = []
        if (rawq.toLowerCase() === 'none') {
            requirements = false
        } else if (rawq.includes('.')) {
            const roles = rawq.split('.')
            for (const role of roles) {
                if (!message.guild.roles.cache.has(role)) {
                    return message.reply(
                        `Could not find any role with the ID ${role} in this server.`
                    )
                } else {
                    requirements.push(role)
                }
            }
        } else {
            requirements.push(rawq)
        }

        args.shift()
        // prize --tags
        let prize = ''
        let dMessage = false
        let donor = false
        if (message.content.includes('--')) {
            let safeArgs = args
            prize = args.join(' ').split('--')[0]
            console.log(prize)
            console.log(`ARGS: ${args}\nSAFE ARGS: ${safeArgs}\n\n`)
            safeArgs = safeArgs.join(' ').split('--')
            safeArgs.shift()
            console.log(`ARGS: ${args}\nSAFE ARGS: ${safeArgs}`)
            const possibleTags = ['msg', 'donor']
            for (const tag of safeArgs) {
                console.log(tag)
                const a = tag.split(' ')
                if (!possibleTags.includes(a[0])) {
                    return message.reply(
                        `\`${a[0]}\` is not a valid tag!\n\nValid tags are: \`--msg <msg>\` and \`--donor <userId>\``
                    )
                }
                if (a[0] === 'msg') {
                    a.shift()
                    dMessage = a.join(' ')
                } else if (a[0] === 'donor') {
                    a.shift()
                    if (!a[0])
                        return message.reply(
                            `Please provide the userId of the donor (if any). Else, do not use the \`--donor\` tag!`
                        )
                    const userId = a[0]
                    let user
                    try {
                        user = await client.users.fetch(userId)
                    } catch (_) {
                        return message.reply(
                            `Could not find any user with the ID \`${userId}\`!`
                        )
                    }
                    donor = user
                }
            }
        } else prize = args.join(' ')

        const embed = new MessageEmbed()
            .setTitle(prize)
            .setDescription(
                `Use the button to enter!\n**Time**: ${require('ms')(time, {
                    long: true,
                })} (<t:${(
                    (new Date().getTime() + parseInt(time)) /
                    1000
                ).toFixed(0)}:R>)\n**Host**: ${message.member.toString()}`
            )
            .setFooter({
                text: `Winners: ${winners} | Ends at `,
            })
            .setColor('GREEN')
            .setTimestamp(new Date().getTime() + time)
        if (requirements && requirements.length) {
            embed.addField(
                'Requirements:',
                `Roles: ${requirements.map((val) => `<@&${val}>`).join(', ')}`,
                false
            )
        }
        if (!donor) donor = message.member
        if (donor) embed.addField('Sponsor:', `${donor.toString()}`, false)

        let embeds = []
        embeds.push(embed)
        if (dMessage) {
            embeds.push(
                new MessageEmbed()
                    .setDescription(`**Sponsor's message:** ${dMessage}`)
                    .setColor('GREEN')
            )
        }

        const row = new MessageActionRow().addComponents([
            new MessageButton()
                .setEmoji('🎉')
                .setCustomId('giveaway-join')
                .setStyle('SUCCESS'),
        ])

        await message.delete()
        const mmmm = await message.channel.send({
            embeds,
            components: [row],
        })

        const dbDat = {
            guildId: message.guild.id,
            channelId: message.channel.id,
            messageId: mmmm.id, //
            hosterId: message.author.id,
            winners,
            sponsor: { id: donor.id, thanks: 0 },
            prize,
            endsAt: new Date().getTime() + time,
            hasEnded: false,
            requirements: [],
            entries: [],
        }
        if (requirements) {
            dbDat.requirements = requirements
        }

        const dbGaw = new giveawayModel(dbDat).save()
        client.channels.cache.get('950386296436695061').send({
            embeds: [
                {
                    description: `New Giveaway:\n\`\`\`js${inspect(
                        dbGaw
                    )}\n\`\`\``,
                },
            ],
        })
    },
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}
