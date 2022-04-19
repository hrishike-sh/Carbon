const { Message } = require('discord.js')
const db = require('../../database/models/user')
const { getMilliseconds } = require('better-ms')
module.exports = {
    name: 'investor',
    subcommands: ['show', 'days'],
    category: 'Donation',
    /**
     * @param {Message} message
     * @param {String[]} args
     */
    async execute(message, args) {
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.reply('Only admins can run this command.')
        }
        const example = `\n\nExamples: \`fh investor show\`, \`fh investor days 598918643727990784 +30\` or \`fh investor days 598918643727990784 -10\``
        if (!args[0]) {
            return message.reply("Tell me what i'm supposed to do." + example)
        }

        if (!this.subcommands.includes(args[0].toLocaleLowerCase())) {
            return message.reply("Tell me what i'm supposed to do." + example)
        }
        const todo = args[0].toLowerCase()

        if (todo === 'show') {
            const all = await db.find({
                'fighthub.investor.isInvestor': true,
            })
            let mapp = ''
            let i = 0
            for (const one of all.sort(
                (a, b) =>
                    a.fighthub.investor.expiresOn -
                    b.fighthub.investor.expiresOn
            )) {
                let user
                try {
                    user = await message.client.users.fetch(one.userId)
                } catch (_) {
                    continue
                }
                mapp += `${i + 1}: **${
                    user.tag
                }**(${user.toString()}) expires ${message.client.functions.formatTime(
                    one.fighthub.investor.expiresOn,
                    'R'
                )}\n`
                i++
            }
            await message.channel.send({
                embeds: [
                    {
                        title: 'Investors',
                        color: 'GREEN',
                        timestamp: new Date(),
                        description: `**To add/remove days, type \`fh investor days <user_id> +/-<amount>\`**\n\n${
                            mapp || 'None!'
                        }`,
                    },
                ],
            })
        } else {
            args.shift()
            if (!args[0]) return message.reply('Provide a user id next time.')
            let user
            try {
                user = await message.guild.members.fetch({ user: args[0] })
            } catch (e) {
                return message.reply(
                    `Could not find that user in this guild.\nError: ${e.message}`
                )
            }
            let dbUser = await db.findOne({
                userId: user.id,
            })
            if (!dbUser) {
                dbUser = new db({
                    userId: user.id,
                })
            }
            if (!dbUser.investor) {
                dbUser.fighthub.investor = {
                    isInvestor: false,
                    expiresOn: new Date().getTime(),
                }
            }
            args.shift()
            if (!args[0])
                return message.reply('Provide number of days next time.')

            const amount = getMilliseconds(`${args[0]}d`)
            dbUser.fighthub.investor.isInvestor = true
            dbUser.fighthub.investor.expiresOn += amount
            dbUser.save()
            message.react('☑')
        }
    },
}
