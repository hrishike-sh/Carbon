const Messages = require('discord-messages')
const Heists = require('../../functions/heist-dono')
const Grinds = require('../../functions/grind-dono')
const { MessageEmbed } = require('discord.js')
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
        let user3 = await Grinds.fetch(target.id, message.guild.id, true)
        if (!user && !user2 && !user3) return mainMessage.edit({
            embed: {
                description: 'Either the target has not donated any amount OR your donations are yet to be counted!'
            }
        })
       let donationAmount = {
           amount: user.data.messages || 0,
           position: user.position || null
       }
       let heistAmount = {
           amount: user2.data.amount || 0,
           position: user2.position || null
       }
       let grindAmount = {
           amount: user3.data.amount || 0,
           position: user3.position || 0
       }
       const totalAmount = grindAmount.amount + donationAmount.amount + heistAmount.amount
        const embed = new MessageEmbed()
            .setTitle("Donations")
            .setDescription(`Donation info for the user ${target}!\nTotal amount donated towards the server: **${totalAmount.toLocaleString()}** coins`)
            .setThumbnail("https://cdn.discordapp.com/emojis/862774540895125584.png?v=1")
            .addFields([{
                    name: 'Donated amount (Donations)',
                    value: `> ${donationAmount.amount.toLocaleString()}`,
                    inline: true
                },
                {
                    name: "Leaderboard position (Donations)",
                    value: `> ${donationAmount.position ? donationAmount.position : "None"}`,
                },
                {
                    name: "Donated amount (Heists)",
                    value: `> ${heistAmount.amount.toLocaleString()}`,
                    inline: true
                },
                {
                    name: "Leaderboard position (Heists)",
                    value: `> ${heistAmount.position ? heistAmount.position : "None" }`,
                },
                {
                    name: "Grinders Amount",
                    value: `> ${grindAmount.amount.toLocaleString()}`
                }
            ])
            .setTimestamp()
            .setFooter("Thanks for donating!")
            .setColor("RANDOM")

        mainMessage.edit(embed)
    }
}