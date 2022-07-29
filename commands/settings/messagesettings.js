const { Message } = require('discord.js')
const db = require('../../database/models/user')
module.exports = {
    name: 'messagesettings',
    fhOnly: false,
    aliases: ['msettings', 'contentsettings'],
    fhOnly: true,
    /**
     * @param {Message} message
     * @param {String[]} args
     */
    async execute(message, args) {
        let user = await db.findOne({
            userId: message.author.id,
        })

        if (!user) {
            user = new db({
                userId: message.author.id,
                messageSettings: {
                    highlightsDisabled: false,
                    snipesDisabled: false,
                    lastPingDisabled: false,
                },
            })
        }

        const options = ['highlights', 'snipes', 'lastping']

        if (!args[0] || !options.includes(args[0])) {
            return message.channel.send({
                embeds: [
                    {
                        title: 'Your Message Content Settings',
                        description: `Highlights Disabled: ${
                            user.messagesettings?.highlightsDisabled ?? false
                        }\nSnipes/Edit Snipes Disabled: ${
                            user.messagesettings?.snipesDisabled ?? false
                        }\nLast Ping Messages Disabled: ${
                            user.messagesettings?.lastPingDisabled ?? false
                        }`,
                    },
                    {
                        title: 'Help - Invalid option entered',
                        description: `To disable/enable a certain message content setting, please use one of the following sub-commands:\n${options
                            .map((o) => `**\`fh msettings ${o}\`**`)
                            .join('\n')}`,
                    },
                ],
            })
        }

        if (options[0] === args[0]) {
            if (user.messagesettings?.highlightsDisabled === false) {
                user.messagesettings.highlightsDisabled = true
                user.save()

                return message.channel.send(
                    `Toggled the highlight message setting.\nIt is now **enabled** which means your messages **won't** be tracked for other users' highlights.`
                )
            } else {
                user.messagesettings.highlightsDisabled = false
                user.save()

                return message.channel.send(
                    `Toggled the highlight message setting.\nIt is now **disabled** which means your messages **will** be tracked for other users' highlights.`
                )
            }
        } else if (options[1] === args[0]) {
            if (user.messagesettings?.snipesDisabled === false) {
                user.messagesettings.snipesDisabled = true
                user.save()

                return message.channel.send(
                    `Toggled the snipe/esnipe message setting.\nIt is now **disabled** which means your messages **won't** be tracked for snipes/edit snipes (message deletions & edits).`
                )
            } else {
                user.messagesettings.snipesDisabled = false
                user.save()

                return message.channel.send(
                    `Toggled the snipe/esnipe message setting.\nIt is now **disabled** which means your messages **will** be tracked for snipes/edit snipes (message deletions & edits).`
                )
            }
        } else if (options[2] === args[0]) {
            if (user.messagesettings?.lastPingDisabled === false) {
                user.messagesettings.lastPingDisabled = true
                user.save()

                return message.channel.send(
                    `Toggled the last ping message setting.\nIt is now **enabled** which means your messages **won't** be logged when you ping a user/they check their last pings through the command.`
                )
            } else {
                user.messagesettings.lastPingDisabled = false
                user.save()

                return message.channel.send(
                    `Toggled the last ping message setting.\nIt is now **disabled** which means your messages **will** be logged when you ping a user/they check their last pings through the command.`
                )
            }
        }
    },
}
