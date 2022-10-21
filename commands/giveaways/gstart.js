const ms = require('better-ms')
const giveawayModel = require('../../database/models/giveaway')
const {
    Message,
    Client,
    ButtonBuilder,
    ActionRowBuilder,
    EmbedBuilder,
    ButtonStyle,
} = require('discord.js')
const server = require('../../database/models/settingsSchema')
const { inspect } = require('util')
module.exports = {
    name: 'gstart',
    alises: ['g', 'giveaway', 'gaw'],
    description:
        'Host a giveaway in your server!\n\nUse `fh gstart help` for more info!',
    category: 'Giveaways',
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
                    },
                ],
            })
        }
        const helpBed = new EmbedBuilder()
            .setTitle('Giveaway Help')
            .setColor('Random')
            .setDescription(
                'To start giveaways you first need to have valid permissions and to add these ask an admin to add certain roles that can create giveaways by /gconfig.\n'
            )
            .addFields([
                {
                    name: `Format`,
                    value: `\`fh g <time> <winners> <requirements> <prize> --donor <user_id> --msg <message>\``,
                    inline: false,
                },
            ])
            .addFields([
                {
                    name: 'Requirements',
                    value: `Requirements should be role ids and multiple role requirements can be seperated by ".".\n\nExample: \`\`fh gstart 24h 1 123456.123457 DN\`\``,
                    inline: true,
                },
            ])
            .addFields([
                {
                    name: `Message`,
                    value: `You can provide a message from the sponsor via the --msg tag.\n\nExample: \`\`fh gstart 2h 1 none Trophy --msg i scammed a kid\`\``,
                    inline: true,
                },
            ])
            .addFields([
                {
                    name: `Thank feature`,
                    value: `The bot provides a "Thank the Sponsor" button on joined giveaway message. When users click this +1 thank is added. When the giveaway ends, the Sponsor or host(if sponsor is not provided) gets a dm from the bot showing how many thanks they got!`,
                    inline: true,
                },
            ])
            .addFields([
                {
                    name: 'Bypasses',
                    value: `Users can bypass giveaways if they have certain roles. Admins can define these roles via /gconfig!`,
                    inline: true,
                },
            ])
            .addFields([
                {
                    name: 'Blacklists',
                    value: 'You can deny users that have certain roles from entering giveaways by adding blacklisted roles via /gconfig!',
                    inline: true,
                },
            ])
            .addFields([
                {
                    name: 'Examples',
                    value: `\`\`fh gstart 1h20m 5 12391238123123.12391239123 Nitro Classic --donor 8971238123912312\`\`\n\`\`fh gstart 90m92s 2 none Absolutely Nothing! --donor 128931237123 --msg im so generous\`\`\n\`\`fh gstart 30s 1 none test\`\``,
                    inline: false,
                },
            ])
        if (!args[0])
            return message.reply({
                embeds: [helpBed],
            })
        if (args[0].toLowerCase() === 'help') {
            return message.reply({
                embeds: [helpBed],
            })
        }
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

        const embed = new EmbedBuilder()
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
            .setColor('Green')
            .setTimestamp(new Date().getTime() + time)
        if (requirements && requirements.length) {
            embed.addFields([
                {
                    name: 'Requirements:',
                    value: `Roles: ${requirements
                        .map((val) => `<@&${val}>`)
                        .join(', ')}`,
                    inline: false,
                },
            ])
        }
        if (!donor) donor = message.member
        if (donor)
            embed.addFields([
                {
                    name: 'Sponsor:',
                    value: `${donor.toString()}`,
                    inline: false,
                },
            ])

        let embeds = []
        embeds.push(embed)
        if (dMessage) {
            embeds.push(
                new EmbedBuilder()
                    .setDescription(`**Sponsor's message:** ${dMessage}`)
                    .setColor('Green')
            )
        }

        const row = new ActionRowBuilder().addComponents([
            new ButtonBuilder()
                .setEmoji('🎉')
                .setCustomId('giveaway-join')
                .setStyle(ButtonStyle.Success),
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
                new EmbedBuilder()
                    .setTitle('New giveaway')
                    .addField([
                        {
                            name: 'Guild',
                            value: message.guild.name + `(${message.guildId})`,
                            inline: true,
                        },
                    ])
                    .addField([
                        {
                            name: 'Channel',
                            value: message.channel.toString(),
                            inline: true,
                        },
                    ])
                    .addField([
                        {
                            name: 'Prize | time',
                            value: `${
                                dbDat.prize
                            } | ends ${client.functions.formatTime(
                                dbDat.endsAt
                            )}`,
                            inline: true,
                        },
                    ])
                    .addField([
                        { name: 'Host', value: message.member.toString() },
                    ]),
                {
                    title: 'Raw',
                    description: `New Giveaway:\n\`\`\`js\n${inspect(
                        dbDat
                    )}\n\`\`\``,
                },
            ],
        })
    },
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}
