const { Client, Message, MessageEmbed, splitMessage } = require('discord.js')
const db = require('../../database/models/grindm')
const ms = require('ms')
module.exports = {
    name: 'grinders',
    aliases: 'grinder',
    fhOnly: true,
    category: 'Donation',
    disabledChannels: [],
    /**
     * @param {Client} client
     * @param {Message} message
     * @param {String[]} args
     */
    async execute(message, args, client) {
        if (!message.member.permissions.has('ADMINISTRATOR')) {
            return message.channel.send(
                'You need the `ADMINISTRATOR` permission to run this command.'
            )
        }

        if (!args[0]) {
            const helpBed = new MessageEmbed()
                .setTitle('Grinders')
                .setDescription(
                    'Help command for grirnders.\n\nAvailable commands:'
                )
                .addField(
                    'fh grinders add <id>/<@mention>',
                    'Adds a new grinder to the grinders team.'
                )
                .addField(
                    'fh grinders remove <id><@mention>',
                    'Removes the user from the grinders team.'
                )
                .addField(
                    'fh grinders days <days>',
                    "Adds __x__ amount of days to the grinder's profile."
                )
                .addField(
                    'fh grinders pending',
                    'Lists all the users who are yet to pay the grinder cash.'
                )
                .setTimestamp()

            return message.channel.send({ embeds: [helpBed] })
        }

        const firstArg = args[0].toLowerCase()

        if (firstArg === 'add') {
            args.shift()
            if (!args[0]) {
                return message.channel.send(
                    'Please either @ping the user or give me a valid id.'
                )
            }

            let user =
                message.mentions.users.size > 0
                    ? message.mentions.users.first().id
                    : args[0]
            user = message.guild.members.cache.get(user) || null
            if (!user) {
                return message.channel.send(
                    'Please either @ping the user or give me a valid id.'
                )
            }

            const dbUser = await db.findOne({ userID: user.id })

            if (dbUser) {
                return message.channel.send('The user is already a grinder.')
            }

            new db({
                userID: user.id,
                guildID: message.guild.id,
                amount: 0,
                time: new Date().getTime(),
            }).save()

            return message.channel.send(
                `Done! ${user} was added to the grinder team.`
            )
        } else if (firstArg === 'remove') {
            args.shift()
            if (!args[0]) {
                return message.channel.send(
                    'Please either @ping the user or give me a valid id.'
                )
            }

            let user =
                message.mentions.users.size > 0
                    ? message.mentions.users.first().id
                    : args[0]
            user = client.users.cache.get(user) || null
            if (!user) {
                return message.channel.send(
                    'Please either @ping the user or give me a valid id.'
                )
            }

            const dbUser = await db.findOne({ userID: user.id })

            if (!dbUser) {
                return message.channel.send('The user is not a grinder.')
            }

            // await db.deleteOne({ userID: user.id })

            return message.channel.send(
                `Done! ${user} was removed from the grinders team.`
            )
        } else if (firstArg === 'days' || firstArg === 'day') {
            args.shift()
            if (!args[0]) {
                return message.channel.send(
                    'Please specify the number of days.\n\nExample: `fh grinders days 5`'
                )
            }
            if (isNaN(args[0])) {
                return message.channel.send(
                    `Specify a number in days. Example: \`fh grinder days 1\``
                )
            }
            await message.reply(
                'Mention the user in chat now.\n\nYou have 15 seconds.'
            )
            const collector = message.channel.createMessageCollector({
                filter: (m) => m.author.id === message.author.id,
                time: 15000,
            })
            /**
             * @param {Message} msg
             */
            collector.on('collect', async (msg) => {
                if (msg.mentions.users.size < 1) {
                    collector.stop()
                    message.channel.send(
                        'You have to actually ping someone lol. The command is cancelled'
                    )
                } else {
                    const mention = msg.mentions.users.first().id

                    const dbUserr = await db.findOne({ userID: mention })
                    if (!dbUserr) {
                        collector.stop()
                        return message.channel.send(
                            'No such user found in the grinders team.'
                        )
                    }
                    collector.stop()
                    dbUserr.time = dbUserr.time + ms(`${args[0]}d`)
                    dbUserr.save()

                    return message.channel.send(
                        `Done! The user will now have to pay <t:${(
                            dbUserr.time / 1000
                        ).toFixed(0)}:R>.`
                    )
                }
            })
        } else if (firstArg === 'pending') {
            const q = await db.find({
                time: {
                    $lt: new Date().getTime(),
                },
            })

            if (!q.length) {
                const embed = new MessageEmbed()
                    .setTitle('Grinder Pendings')
                    .setDescription('All grinders are upto date.')
                    .setColor('GREEN')
                    .setTimestamp()

                return message.channel.send({ embeds: [embed] })
            }
            const mapp = q
                .map(
                    (v) =>
                        `=> <@${v.userID}> (${
                            message.guild.members.cache.get(v.userID).user.username}#${message.guild.members.cache.get(v.userID).user.discriminator}
                            ) pending since <t:${(v.time / 1000).toFixed(0)}:R>`
                )
                .join('\n')

            if (mapp.length > 5500) {
                await message.channel.send(
                    'A lot of pendings, the embed wont work.\nSending not-so-fancy messages...'
                )
                const messages = splitMessage(mapp)
                messages.forEach((m) => {
                    message.channel.send(m)
                })
                return
            }
            const embed2 = new MessageEmbed()
                .setTitle('Grinder Pendings')
                .setDescription(`${mapp}`)
                .setColor('RED')
                .setTimestamp()

            message.channel.send({ embeds: [embed2] })
        }
    },
}
