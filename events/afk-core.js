
const db = require('../database/models/user')

module.exports = {
    name: 'message',
    once: false,
    async execute(message, client) {
        if (!message.guild) return;
        if (message.guild.id !== '824294231447044197') return;
        if (message.author.bot) return;
        if (client.afkIgnore.includes(message.channel.id)) return;
        if (client.afks.includes(message.author.id)) {
            client.afks = client.afks.filter(u => u !== message.author.id)
            message.member.setNickname(message.member.displayName.replace(/~ AFK/, ""));
            message.channel.send(`Welcome back ${message.member}! I have removed your AFK.`).then((msg) => {
                setTimeout(() => {
                    msg.delete()
                }, 2500)
            })
            const u = await db.findOne({ userId: message.author.id })
            u.afk = {
                afk: false,
                reason: '',
                time: null
            }
            u.save()
            return;
        }
        if (message.mentions.users.size < 1) return;
        if (message.guild.id !== '824294231447044197') return;
        const mention = message.mentions.users.first().id
        const user1 = await db.findOne({ userId: mention })

        if (!user1) return;
        if (!user1.afk.afk) return;

        return message.channel.send(`${message.mentions.users.first().username} is currently afk: ${user1.afk.reason} - <t:${(user1.afk.time / 1000).toFixed(0)}:R>`)
    }
}