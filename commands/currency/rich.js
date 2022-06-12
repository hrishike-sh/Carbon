const { Message, MessageEmbed } = require('discord.js')
const DB = require('../../database/models/currency')
module.exports = {
    name: 'rich',
    description: 'Check who the richest is!',
    /**
     * @param {Message} message
     */
    async execute(message) {
        const ALL = await DB.find()
        const sorted = ALL.sort((a, b) => b.Balance - a.Balance).slice(0, 10)
        const thisUser = ALL.find((a) => a.userId === message.author.id)

        let data = ''
        let inLb = false
        for (const x of sorted) {
            const user = await message.client.users.fetch(x.userId)
            if (user.id == message.author.id) {
                inLb = true
                const index = sorted.indexOf(x) + 1
                data += `**${getBmotes(
                    index < 10 ? `0${index}` : index
                )}: ${user.toString()} => ${x.Balance.toLocaleString()} coins**`
            } else {
                const index = sorted.indexOf(x) + 1
                data += `${getBmotes(
                    index < 10 ? `0${index}` : index
                )}: ${user.toString()} => ${x.Balance.toLocaleString()} coins`
            }
        }
        const dbUser = ALL.find((a) => a.userId === message.author.id)
        if (!inLb && dbUser) {
            data += `\n\n${getBmotes(
                ALL.sort((a, b) => b.Balance - a.Balance).indexOf(dbUser) + 1
            )}: ${message.author.toString()} => ${dbUser.Balance.toLocaleString()} coins`
        }

        return message.reply({
            embeds: [
                {
                    title: 'Rob them lol',
                    description: data,
                    footer: {
                        text: 'the richest user is hrish!!!',
                    },
                    color: 'GREEN',
                },
            ],
        })
    },
}
const emojis = [
    '<:bo:919555310228742144>',
    '<:black1:919554266929197117>',
    '<:b2:919554323363557396>',
    '<:b3:919559077485486091>',
    '<:b4:919559410668425266>',
    '<:b5:919554441525493760>',
    '<:b6:919554511247388712>',
    '<:b7:920240450667950101>',
    '<:b8:931434424787148840>',
    '<:b9:919554613840076840>',
]
function getBmotes(number) {
    const str = `${number}`
    let final = ''
    for (const char of str) {
        final += `${emojis[parseInt(char)]}`
    }
    return final
}
