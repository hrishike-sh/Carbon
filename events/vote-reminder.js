
const { Message, Client, MessageEmbed } = require('discord.js')
const db = require('../database/models/user')
const ms = require('ms')
module.exports = {
    name: 'message',
    once: false,
    /**
     * 
     * @param {Message} message 
     * @param {Client} client 
     */
    async execute(message, client) {
        if (!message.guild) return;
        if (message.guild.id !== client.storage.fighthub.id) return;
        if (message.channel.id !== '826929140019232788') return; // vote channel
        if (message.author.id !== '479688142908162059') return; // vote tracker

        if (!message.embeds) return;
        const id = message.embeds[0].description.split("(id:")[1].split(")")[0]
        const user = message.guild.members.cache.get(id) || await message.guild.members.fetch(id)

        if (!user) return;
        console.log(user)

        let dbUser = await db.findOne({ userId: message.author.id })
        if (!dbUser || !dbUser.fighthub.voting) {
            dbUser = new db({
                userId: message.author.id,
                fighthub: {
                    voting: {
                        hasVoted: true,
                        lastVoted: new Date().getTime() + ms("12h"),
                        enabled: true
                    }
                }
            })
        }
        if (dbUser.fighthub && !dbUser.fighthub.voting.enabled) return; // disabled reminders

        dbUser.fighthub = {
            voting: {
                hasVoted: true,
                lastVoted: new Date().getTime() + ms("12h"),
                enabled: true
            }
        }
        dbUser.save()

        const a = await user.user.createDM()

        a.send({
            embed: new MessageEmbed()
                .setTitle("Thank you for voting!")
                .setDescription(`You have voted for **[FightHub](https://discord.gg/fight)** and got the \`・Voter\` role for 12 hours!\n\nYou will be reminded <t:${(dbUser.fighthub.voting.lastVoted / 1000).toFixed(0)}:R> to vote again! You can toggle vote reminders by running \`fh voterm\`.`)
                .setColor("GREEN")
                .setTimestamp()
                .setThumbnail(client.storage.fighthub.iconURL())
        })

        const web = await client.fetchWebhook("921645605070200852")
        web.send(`**${user.tag}** voted for the server.`)
    }
}