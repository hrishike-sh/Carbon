const { Message, Client } = require('discord.js')
const { exec } = require('shelljs')
module.exports = {
    name: 'exec',
    aliases: ['ex'],
    usage: '<string>',
    description: 'Run code in shell.',
    async execute(message, args, client) {
        if (!client.config.idiots.includes(message.author.id))
            return message.reply(':clown:')

        const query = args.join(' ')
        const results = await exec(query)

        return message.reply(`Output:\n\`\`\`js\n${results.stdout}\n\`\`\``)
    },
}
