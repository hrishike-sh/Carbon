const { Message, MessageEmbed } = require('discord.js')
const itemsDb = require('../../database/models/itemSchema')
const db = require('../../node_modules/discord-messages/models/messages')
module.exports = {
    name: 'log-this',
    aliases: ['logthis'],
    usage: '<@USER>',
    /**
     * @param {Message} message
     * @param {String[]} args
     */
    async execute(message, args) {
        const modRoles = ['824348974449819658', '824539655134773269']
        if (!message.member.roles.cache.hasAny(...modRoles)) {
            return message.reply("You can't use this command bozo")
        }

        if (!message.reference) {
            return message.reply('You must reply to the message.')
        }

        if (!message.mentions.users.size) {
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
            itemms.push(iitem.display.name.split(' ').join('').toLowerCase())
        }
        const itemArray = getItems(
            dankMessage.embeds[0].fields[0].value.split('\n')
        )
        let toAdd = 0
        const erray = []
        let doneTems = []
        for (const item of itemArray.split('\n')) {
            if (!item.length) continue
            console.log(item)
            if (item.includes('x')) {
                const temp = item.split('x', 1)
                const amount = temp[0]
                let ktem = item.replace(`${amount}x`, '')
                let got = false
                for (const i of itemms) {
                    if (got) continue
                    const res = i.localeCompare(ktem)
                    if (res === 0) {
                        got = true
                        const value =
                            amount *
                            (dbItems.find(
                                (a) =>
                                    a.display.name
                                        .split(' ')
                                        .join('')
                                        .toLowerCase() === ktem
                            )
                                ? dbItems.find(
                                      (a) =>
                                          a.display.name
                                              .split(' ')
                                              .join('')
                                              .toLowerCase() === ktem
                                  ).value
                                : 0)
                        if (
                            !doneTems.includes(
                                `${amount}x ${ktem}: ⏣ ${value.toLocaleString()}`
                            )
                        )
                            doneTems.push(
                                `${amount}x ${ktem}: ⏣ ${value.toLocaleString()}`
                            )
                        console.log(`will add ${value}`)
                        toAdd += value
                    } else {
                        if (
                            !erray.includes(
                                `Couldn't find any item in the database with the ID \`${ktem}\``
                            )
                        ) {
                            erray.push(
                                `Couldn't find any item in the database with the ID \`${ktem}\``
                            )
                        }
                    }
                }
            } else {
                if (!doneTems.includes(`⏣ ${parseInt(item)}`)) {
                    doneTems.push(`⏣ ${parseInt(item)}`)
                }
                toAdd += parseInt(item)
                console.log(`will add ${item}`)
            }
        }

        const embed = new MessageEmbed()
            .setTitle('temp')
            .setDescription(`Logged items:\n> ${doneTems.join('\n> ')}`)
            .setColor('GREEN')
        let dbUser
        try {
            dbUser = await db.findOne({
                userID: message.mentions.users.first().id,
                guildID: message.guild.id,
            })
            if (!dbUser) {
                dbUser = new db({
                    userID: message.mentions.users.first().id,
                    guildID: message.guild.id,
                    messages: 0,
                })
            }

            dbUser.messages += toAdd
            dbUser.save()
        } catch (e) {
            return message.reply(
                `An error occured while saving amount to database.\nError: ${e.message}`
            )
        }
        embed.addField('Amount added:', `⏣ ${toAdd.toLocaleString()}`, true)
        embed.addField(
            'Total amount donated:',
            `⏣ ${dbUser.messages.toLocaleString()}`,
            true
        )
        if (erray.length) {
            embed.addField('ERRORS:', erray.join('\n'))
        }
        return message.reply({
            embeds: [embed],
        })
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
