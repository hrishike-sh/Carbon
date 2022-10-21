const { Message, Client, EmbedBuilder } = require('discord.js')
const shell = require('shelljs')
module.exports = {
    name: 'git-pull',
    aliases: ['gitpull'],
    description: 'Git pull ?',
    /**
     *
     * @param {Message} message
     * @param {*} args
     * @param {Client} client
     * @returns
     */
    async execute(message, args, client) {
        if (!client.config.idiots.includes(message.author.id)) return

        let res = ''
        let err = ''

        const results = shell.exec('git pull')

        if (results.stderr) err = results.stderr
        res = results.stdout
        const embed = new EmbedBuilder()
            .setTitle('Git Pull')
            .setColor(err ? 'Red' : 'Green')
            .setTimestamp()
            .addFields([{ name: 'Returned:', value: res, inline: false }])

        if (err)
            embed.addFields([{ name: 'Error:', value: err, inline: false }])

        return message.reply({ embeds: [embed] })
    },
}
