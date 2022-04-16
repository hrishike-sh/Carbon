const { Message, MessageEmbed } = require('discord.js')
const itemsDb = require('../../database/models/itemSchema')

module.exports = {
    name: 'log-this',
    aliases: ['logthis'],
    usage: '<@USER>',
    /**
     * @param {Message} message
     * @param {String[]} args
     */
    async execute(message, args) {
        const modRoles = ['824348974449819658']
        if (!message.member.roles.cache.hasAny(...modRoles)) {
            return message.reply("You can't use this command bozo")
        }

        if (!message.reference) {
            return message.reply('You must reply to the message.')
        }

        if (!args[0]) {
            return message.reply('You must @ the user.')
        }

        const dankMessage = await message.channel.messages.fetch(
            message.reference.messageId
        )
        if (!dankMessage.embeds.length) {
            return message.reply(
                "Not the right message? Couldn't find any embeds."
            )
        }
        const dbItems = await itemsDb.find({})
        const itemms = []
        for (const iitem of dbItems) {
            itemms.push(iitem.item_id)
        }
        const itemArray = getItems(
            dankMessage.embeds[0].fields[0].value.split('\n')
        )
        let toAdd = 0
        for (const item of itemArray.split('\n')) {
            if (item.includes('x')) {
                const temp = item.split('x')
                const amount = temp[0]
                let ktem = temp[1]
                let got = false
                for (const i of itemms) {
                    if (got) continue
                    const res = i.localeCompare(ktem)
                    if (res === 0) {
                        got = true
                        message.reply(`Found item ${ktem}`)
                    }
                }
            }
        }
    },
}

function getItems(arr) {
    let a = ''
    arr.forEach((value) => {
        if (value.includes('⏣ ')) {
            a += '\n' + value.split('⏣ ')[1].replace(/(\*|,)/g, '')
        } else {
            const array = value
                .split('**')
                .join('')
                .split(' ')
                .join('')
                .replace(/(>|:)/g, ' ')
                .split(' ')
            a +=
                '\n' +
                array.join(' ').match(/[0-9]x/i) +
                array[array.length - 1].toLowerCase()
        }
    })
    return a
}
