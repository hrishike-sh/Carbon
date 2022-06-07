const {
    Message,
    Client,
    MessageEmbed,
    MessageButton,
    MessageActionRow,
    Collection,
} = require('discord.js')
const talked = []
module.exports = {
    name: 'messageCreate',
    once: false,
    /**
     *
     * @param {Message} message
     * @param {Client} client
     */
    async execute(message, client) {
        if (message.guild) return
        if (message.guild.id !== client.db.fighthub.id) return
        if (message.author.bot) return
        console.log(`[HL-CORE] Message Received`)
        const DB = client.db.hl.db
        const hlWords = client.db.hl.all
        const userInDb = client.db.hl.db.find(
            (a) => a.userId == message.author.id
        )
        addUser(message.author, client)

        const hasHlWord = hlWords.some((a) =>
            message.content.toLowerCase().includes(a.toLowerCase())
        )
        if (!hasHlWord) return
        console.log(`[HL-CORE] Message has HL word`)
        const hlWord = hlWords.filter((word) =>
            message.content.toLowerCase().includes(word)
        )[0]
        const users = DB.filter(
            (a) =>
                a.highlight &&
                a.highlight.words.length &&
                a.highlight.words.includes(hlWord)
        )
        console.log(`[HL-CORE] Found ${users.length} users with the highlight!`)
        for (const user of users) {
            if (talked.includes(user.userId)) continue
            console.log(`[HL-CORE] Loop ran`)
            let member
            try {
                member = await message.guild.members.fetch({
                    user: user.userId,
                })
                console.log(`[HL-CORE] Member found`)
            } catch (e) {
                console.log(`[HL-CORE] Member not found`)
                continue
            }
            if (talked.includes(member.id)) continue
            const messages = await message.channel.messages.fetch({
                around: message.id,
                limit: 5,
            })
            let data = []
            for (const msg of messages) {
                data.push(
                    `[${client.functions.formatTime(
                        msg[1].createdTimestamp,
                        'T'
                    )}] **${message.author.tag}**: ${message.content.replace(
                        hlWord,
                        `__${hlWord}__`
                    )}`
                )
            }
            console.log(data)
            const embed = new MessageEmbed()
                .setTitle(`Word: ${hlWord}`)
                .setDescription(data.reverse().join('\n'))
                .setTimestamp()
                .setColor('RANDOM')
            ;(await member.user.createDM()).send({
                embeds: [embed],
                components: [
                    new MessageActionRow().addComponents([
                        new MessageButton()
                            .setStyle('LINK')
                            .setURL(message.url)
                            .setLabel('Jump to Message'),
                    ]),
                ],
            })
            addUser(member, client)
        }
    },
}

const addUser = async (user, client) => {
    // talked.push(user.id)
    // await client.functions.sleep(60 * 1000)
    // talked.splice(talked.indexOf(user.id), 1)
}
