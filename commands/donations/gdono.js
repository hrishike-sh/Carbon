const Messages = require('../../functions/grind-dono')

module.exports = {
    name: 'gdono',
    aliases: ['g'],
    args: true,
    usage: 'd <@USER | USER_ID> <Subtract | Add> <Amount>',
    description: 'Grinder donos.',
    execute(message, args) {
      args.shift()
        const example = `\n\nExample: \`fh g 598918643727990784 add 5e6\` | \`fh g 598918643727990784 remove 5e6\``
        if (
            message.author.id !== '772524332382945292' &&
            message.author.id !== '264186213848580096' &&
            message.author.id !== '598918643727990784' && 
            message.author.id !== '755812617603514439'
        ) {
            return message.channel.send('You can not perform this action.')
        }
        if (!args[0]) return message.channel.send("You must either ping someone or you must give their id" + example)
        const mentionID = message.mentions.users.size > 0 ? message.mentions.users.first().id : args[0]
        if(!Messages.fetch(mentionID, message.guild.id)){
            message.channel.send("That person is not a grinder.\nAdd a grinder using \`fh grinder add @USER\`.")
            return;
        }
        const firstArg = args[0]
        if (!firstArg) return message.channel.send("You must tell me what to do" + example)

        if (firstArg !== 'add' && firstArg !== 'subtract' && firstArg !== 'remove' && firstArg !== '-' && firstArg !== '+' && firstArg !== 'item') {
            return message.channel.send("Invalid response" + example)
        }
        if (firstArg === 'add' || firstArg === '+') {
            let finalNum = 0;
            args.shift()
            if (!args[0]) return message.channel.send("You must provide a number!" + example)
            let number = args[0]
            if (isNaN(parseInt(number[0][0]))) {
                return message.channel.send("Invalid number provided" + example)
            } else {
                if (number.endsWith('k')) {
                    number.replace('k', '')
                    finalNum = parseInt(number) * 1e3
                } else if (number.endsWith('m')) {
                    number.replace('m', '')
                    finalNum = parseInt(number) * 1e6
                } else if (number.endsWith('b')) {
                    number.replace('b', '')
                    finalNum = parseInt(number) * 1e9
                } else if (number.includes('e')) {
                    finalNum = eval(number)
                } else {
                    finalNum = number
                }
            }
            finalNumm = finalNum
            Messages.addGrindDono(mentionID, message.guild.id, finalNum)
            message.channel.send(`Added **${finalNumm.toLocaleString()}** coins to <@${mentionID}>(${mentionID})'s profile!`)
        } else if (firstArg === 'subtract' || firstArg === 'remove' || firstArg === '-') {
            let finalNum = 0
            args.shift()
            if (!args[0]) return message.channel.send("You must provide a number!" + example)
            let number = args[0]
            if (isNaN(parseInt(number[0][0]))) {
                return message.channel.send("Invalid number provided" + example)
            } else {
                if (number.endsWith('k')) {
                    number.replace('k', '')
                    finalNum = parseInt(number) * 1e3
                } else if (number.endsWith('m')) {
                    number.replace('m', '')
                    finalNum = parseInt(number) * 1e6
                } else if (number.endsWith('b')) {
                    number.replace('b', '')
                    finalNum = parseInt(number) * 1e9
                } else if (number.includes('e')) {
                    finalNum = eval(number)
                } else {
                    finalNum = number
                }
            }
            finalNumm = finalNum
            Messages.removeGrindDono(mentionID, message.guild.id, finalNum)
            message.channel.send(`Removed **${finalNumm.toLocaleString()}** coins from <@${mentionID}>(${mentionID})'s profile!`)

        } else;

        
        message.guild.channels.cache.get("845043301937315870").send({
            embed: {
                title: "Grinder Logs",
                color: 'GREEN',
                description: `[Jump](https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}) to message.`,
                fields: [{
                        name: "Responsible Moderator",
                        value: `${message.author.tag} - ${message.author}`,
                        inline: true
                    },
                    {
                        name: "Action",
                        value: `${firstArg}`,
                        inline: false
                    },
                    {
                        name: "Amount",
                        value: `${finalNumm.toLocaleString()} coins.`,
                        inline: true
                    },
                ],
                timestamp: new Date(),
                footer: {
                    text: "Grinder Tracking"
                }
            }
        })

    }
}
