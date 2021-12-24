const ms = require('ms')
const giveawayModel = require('../../database/models/giveaway')
const {
    Message,
    Client,
    MessageButton,
    MessageActionRow,
} = require('discord.js')
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
        if (
            !message.member.roles.cache.some(
                (role) => role.id === '824348974449819658'
            ) &&
            !message.member.roles.cache.some(
                (role) => role.id === '825783847622934549'
            ) &&
            !message.member.roles.cache.some(
                (role) => role.id === '858088054942203945'
            )
        ) {
            return message.channel.send(
                `You do not have perms to run this command.`
            )
        }

        //fh gstart 10s 1w [requirements] prize

        let time = args[0]
        if (time === 'help')
            return message.channel.send({
                embed: {
                    title: 'Giveaway Help',
                    description: 'Here is some help:',
                    fields: [
                        {
                            name: 'Arguments',
                            value: `fh gstart <Time> <No. of winners (Currently 1 Max)> <Requirements> <Prize>`,
                            inline: true,
                        },
                        {
                            name: 'Requirements',
                            value: `To provide valid requirements, use the role id(s). To give multiple requirements, seperate the role ids with a "."\nUse "None" if there are no requirements.`,
                            inline: true,
                        },
                        {
                            name: 'Examples',
                            value: `\`fh gstart 10m 1w none Trophy\`\n\`fh gstart 1h 1w 824687107192520705 Pepe Medal\`\n\`fh gstart 6h 1w 824329689534431302.826099300383457341 DN Joke Pass\``,
                        },
                    ],
                },
            })
        if (!time) return message.channel.send('You must specify time.')
        if (isNaN(ms(time)))
            return message.channel.send('Please specify valid time.')
        args.shift()
        time = ms(time)
        let winners = args[0]
        if (!winners || isNaN(parseInt(winners)))
            return message.channel.send(
                'You must specify the number of winners.'
            )
        winners = parseInt(winners)
        //requirements
        args.shift()
        const rawquirement = args[0]
        if (!rawquirement)
            return message.channel.send(
                `You must specify a requirement or \`none\`.`
            )
        let requirement = []
        if (rawquirement.toLowerCase() === 'none') {
            requirement = null
        } else {
            const reqs = rawquirement.split('.')
            for (const req of reqs) {
                const role = message.guild.roles.cache.some(
                    (role) => role.id === req
                )
                if (!role)
                    return message.channel.send(
                        `I couldn't find any role with the ID "${req}"!`
                    )

                requirement.push(req)
            }
        }

        //requirements
        args.shift()
        let prize = args.join(' ')
        if (!prize) prize = 'Prize'

        if (time > 1) {
            // database giveaway
            const enterBut = new MessageButton()
                .setLabel('Enter')
                .setStyle('SUCCESS')
                .setCustomId('giveaway-join')
            const infoBut = new MessageButton()
                .setLabel('View Info')
                .setStyle('grey')
                .setCustomId('giveaway-info')
            const row = new MessageActionRow().addComponents([
                enterBut,
                infoBut,
            ])
            const hrish = await message.channel.send({
                embed: {
                    title: prize,
                    color: 'RANDOM',
                    description: `Use the button to enter!!\nTime: **${ms(
                        time,
                        { long: true }
                    )}** (ends <t:${(
                        (new Date().getTime() + time) /
                        1000
                    ).toFixed(0)}:R>)\nHosted by: ${message.member}`,
                    fields: [
                        {
                            name: 'Requirements:',
                            value: `Roles: ${
                                requirement
                                    ? requirement
                                          .map((x) => `<@&${x}>`)
                                          .join(', ')
                                    : 'None!'
                            }`,
                        },
                    ],
                },
                components: [row],
            })
            const gaw = new giveawayModel({
                guildId: message.guild.id,
                channelId: message.channel.id,
                messageId: hrish.id,
                hosterId: message.author.id,
                winners: winners,
                prize: prize,
                requirements: requirement,
                endsAt: new Date().getTime() + time,
                hasEnded: false,
            })
            gaw.save()
        } else {
            // regular giveaway
        }
    },
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}
