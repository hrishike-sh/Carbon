const blacklists = require('../../database/models/blacklist')
const ms = require('ms')
module.exports = {
    name: 'blacklist',
    aliases: ['bl'],
    args: true,
    usage: '<user_id> <time>',
    description: 'you dont need to know',
    async execute(message, args) {
        const target = args[0]
        if (!target || typeof target !== 'string' || target.includes('@'))
            return message.channel.send(
                'You must give a valid user id to blacklist.'
            )
        args.shift()

        const time = args[0]
        if (!time) return message.channel.send('You must provide time.')
        if (
            isNaN(time[0][0]) &&
            !time.endsWith('s') &&
            !time.endsWith('m') &&
            !time.endsWith('h') &&
            !time.endsWith('d')
        )
            return message.channel.send(
                `You must provide a valid time.\nExample: \`fh blacklist ${target.id} 1h\``
            )

        const user = await blacklists.findOne({ userID: target })
        console.log(user)
        if (user)
            return message.channel.send('That user is already blacklisted.')

        const { guild, author: staff } = message

        let duration = ms(time)
        const expires = new Date()
        expires.setHours(expires.getHours() + duration)
        return console.log(expires)
        await new blacklists({
            userID: target,
            staffId: staff.id,
            expires,
        }).save()

        message.reply('The user has been blacklisted from using the bot/')
    },
}
