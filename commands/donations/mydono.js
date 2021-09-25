const Messages = require('discord-messages')
const Heists = require('../../functions/heist-dono')
const Grinds = require('../../functions/grind-dono')
const Special = require('../../functions/another-dono-thing-whyy')
const { MessageEmbed } = require('discord.js')
const {
  MessageButton,
  MessageActionRow
} = require('discord-buttons')
module.exports = {
    name: 'mydono',
    aliases: ['myd'],
   async execute(message, args) {
        let target = message.mentions.users.first() || message.author
        const mainMessage = await message.channel.send({
            embed: {
                description: "Fetching database..."
            }
        })
        let user = await Messages.fetch(target.id, message.guild.id, true);
        let user2 = await Heists.fetch(target.id, message.guild.id, true);
        let user3 = await Grinds.fetch(target.id, message.guild.id, true);
        let user4 = await Special.fetch(target.id, message.guild.id, true);
        if (!user && !user2 && !user3 && !user4) return mainMessage.edit({
            embed: {
                description: 'Either the target has not donated any amount OR your donations are yet to be counted!'
            }
        })
       let donationAmount = {
           amount: user.data ? user.data.messages : 0,
           position: user.position || null
       }
       let heistAmount = {
           amount: user2.data ? user2.data.amount : 0,
           position: user2.position || null
       }
       let grindAmount = {
           amount: user3.data ? user3.data.amount : 0,
           position: user3.position || 0
       }
       let specialAmount = {
           amount: user4.data ? user4.data.amount : 0,
           position: user4.position || 0
       }
       const totalAmount = grindAmount.amount + donationAmount.amount + heistAmount.amount + specialAmount.coins
       
       let buttonD = new MessageButton()
        .setLabel("Donations")
        .setID("myd-d")
        .setStyle("grey")

        let buttonH = new MessageButton()
        .setLabel("Heist Donations")
        .setID("myd-h")
        .setStyle("grey")

        let buttonG = new MessageButton()
        .setLabel("Grinder Donations")
        .setID("myd-g")
        .setStyle("grey")

        let buttonS = new MessageButton()
        .setLabel("FF Donations")
        .setID("myd-s")
        .setStyle("grey")

        const row = new MessageActionRow().addComponents([buttonD, buttonH, buttonG, buttonS])

        const dataForD = {
            embed: {
                title: "Donations ~ Regular",
                description: `Donations from <@${target.id}>\nTotal amount donated by the user: **${totalAmount.toLocaleString()}** coins.`,
                fields: [
                    {
                        name: "Donated: ",
                        value: `${donationAmount.amount.toLocaleString()} coins.`
                    },
                    {
                        name: 'Position: ',
                        value: `${donationAmount.position.toLocaleString()}.`
                    }
                ],
                thumbnail: {
                    url: 'https://cdn.discordapp.com/emojis/856224481457602561.png?v=1'
                },
                footer: {
                    text: 'Thank you for donating!'
                },
                timestamp: new Date()
            },
            components: [
                row
            ]
        }
        const dataForH = {
            embed: {
                title: "Donations ~ Heists",
                description: `Donations from <@${target.id}>\nTotal amount donated by the user: **${totalAmount.toLocaleString()}** coins.`,
                fields: [
                    {
                        name: "Donated: ",
                        value: `${heistAmount.amount.toLocaleString()} coins.`
                    },
                    {
                        name: 'Position: ',
                        value: `${heistAmount.position.toLocaleString()}.`
                    }
                ],
                thumbnail: {
                    url: 'https://cdn.discordapp.com/emojis/856224481457602561.png?v=1'
                },
                footer: {
                    text: 'Thank you for donating!'
                },
                timestamp: new Date()
            },
            components: {
                row
            }
        }
        const dataForG = {
            embed: {
                title: "Donations ~ Grinders",
                description: `Donations from <@${target.id}>\nTotal amount donated by the user: **${totalAmount.toLocaleString()}** coins.`,
                fields: [
                    {
                        name: "Donated: ",
                        value: `${grindAmount.amount.toLocaleString()} coins.`
                    },
                    {
                        name: 'Position: ',
                        value: `${grindAmount.position.toLocaleString()}.`
                    }
                ],
                thumbnail: {
                    url: 'https://cdn.discordapp.com/emojis/856224481457602561.png?v=1'
                },
                footer: {
                    text: 'Thank you for donating!'
                },
                timestamp: new Date()
            },
            components: {
                row
            }
        }
        const dataForS = {
            embed: {
                title: "Donations ~ FF Dono",
                description: `Donations from <@${target.id}>\nTotal amount donated by the user: **${totalAmount.toLocaleString}**() coins.`,
                fields: [
                    {
                        name: "Donated: ",
                        value: `${specialAmount.amount.toLocaleString()} coins.`
                    },
                    {
                        name: 'Position: ',
                        value: `${specialAmount.position.toLocaleString()}.`
                    }
                ],
                thumbnail: {
                    url: 'https://cdn.discordapp.com/emojis/856224481457602561.png?v=1'
                },
                footer: {
                    text: 'Thank you for donating!'
                },
                timestamp: new Date()
            },
            components: {
                row
            }
        }
        

        mainMessage.delete()
        const newMessage = await message.channel.send("If your donations are not yet counted, please contact a moderator.", {
            embed: dataForD.embed,
            components: dataForD.components
        })
    }
}