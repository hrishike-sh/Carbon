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
        const itemArray = getItems(
            dankMessage.embeds[0].fields[0].value.split('\n')
        )

        message.reply(itemArray.join('\n'))
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
                array[array.length - 1]
        }
    })
    return a
}
