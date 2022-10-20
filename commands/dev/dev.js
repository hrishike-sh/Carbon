const {
    Message,
    Client,
    EmbedBuilder,
    MessageActionRow,
    MessageButton,
} = require('discord.js')
const axios = require('axios')
const { inspect } = require('util')

module.exports = {
    name: 'dev',
    aliases: ['cringe', 'fuck'],
    description: "Unpaid user's favorite command!!",
    /**
     *
     * @param {Message} message
     * @param {String[]} args
     * @param {Client} client
     */
    async execute(message, args, client) {
        if (!client.config.idiots.includes(message.author.id))
            return message.reply(`This command can only be run by idiots!`)

        const subc = ['stats', 'gdump', 'gban', 'gunban']
        const wtf = args[0]?.toLowerCase()
        if (!wtf || !subc.includes(wtf))
            return message.reply(
                `Not a valid sub-command.\nCommands: ${subc.join(', ')}`
            )

        if (wtf == 'stats') {
            let total = {
                users: 0,
                channels: 0,
                roles: 0,
            }
            client.guilds.cache.forEach((guild) => {
                total.users += guild.memberCount
                total.channels += guild.channels.cache.size
                total.roles += guild.roles.cache.size
            })
            const embed = new EmbedBuilder()
                .setTitle('Bot Stats')
                .addField(
                    'Up since',
                    `${client.functions.formatTime(client.readyAt)}`,
                    false
                )
                .addField(
                    'Cache',
                    `\`\`\`nim\nUSERS: ${client.users.cache.size.toLocaleString()}\nGUILDS: ${client.guilds.cache.size.toLocaleString()}\nCHANNELS: ${client.channels.cache.size.toLocaleString()}\`\`\``,
                    true
                )
                .addField(
                    'Total',
                    `\`\`\`nim\nUSERS: ${total.users.toLocaleString()}\nCHANNELS: ${total.channels.toLocaleString()}\nROLES: ${total.roles.toLocaleString()}\`\`\``,
                    true
                )
                .setColor('RANDOM')

            await message.reply({
                embeds: [embed],
            })
        } else if (wtf == 'gdump') {
            let data = []
            for (const [id, guild] of client.guilds.cache.sort(
                (a, b) => b.memberCount - a.memberCount
            )) {
                data.push(
                    `> ${guild.name} < (ID: ${guild.id})\n    Members: ${guild.memberCount}\n    Channels: ${guild.channels.cache.size}\n    Roles: ${guild.roles.cache.size}`
                )
            }
            data = data.join('\n')
            const link = await uploadResult(data)

            await message.reply(link)
        }
    },
}

async function uploadResult(content) {
    const parseQueryString = (obj) => {
        // stole daunt's code 😍
        let res = ''
        for (const key of Object.keys(obj)) {
            res += `${res === '' ? '' : '&'}${key}=${obj[key]}`
        }
        return res
    }
    const res = await axios.post(
        'https://hastepaste.com/api/create',
        parseQueryString({ raw: false, text: encodeURIComponent(content) }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )
    return res.data
}
