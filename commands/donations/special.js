const sussykesh = require('../../functions/another-dono-thing-whyy')

module.exports = {
    name: 'sdono',
    aliases: ['ff', 'fd'],
    args: true,
    description: 'Special dono thing.',
    fhOnly: true,
    execute(message, args) {
      args.shift()
        const example = `\n\nExample: \`fh ff 598918643727990784 add 5e6\` | \`fh ff 598918643727990784 remove 5e6\``
        if (
            !message.member.roles.cache.some(role => role.id === '824539655134773269') &&
            !message.member.roles.cache.some(role => role.id === '825783847622934549') &&
            !message.member.roles.cache.some(role => role.id === '858088054942203945') &&
            message.author.id !== '598918643727990784'
        ) {
            return message.channel.send('You must have one of the following roles to register this command: \`Moderator\`, \`Giveaway Manager\` or \`Event Manager\`')
        }
        if (!args[0]) return message.channel.send("You must either ping someone or you must give their id" + example)
        const mentionID = message.mentions.users.size > 0 ? message.mentions.users.first().id : args[0]

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
            sussykesh.add(mentionID, message.guild.id, finalNum)
            message.channel.send(`Added **${finalNum.toLocaleString()}** coins to <@${mentionID}>(${mentionID})'s profile!`)
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
            sussykesh.remove(mentionID, message.guild.id, finalNum)
            message.channel.send(`Removed **${finalNum.toLocaleString()}** coins from <@${mentionID}>(${mentionID})'s profile!`)
        } else;


    }
}

