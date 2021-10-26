const { MessageButton, MessageActionRow } = require('discord-buttons')

module.exports = {
    name: 'fastclick',
    async execute(message, args){
        const user1 = message.member
        const user2 = message.mentions.members.first() || message.guild.members.cache.get(args[0])

        if(!user2) return message.channel.send(`You must mention someone to play with them!\n\nExample: \`fh fastclick @Hrishikesh#0369\``)
        
        let yesButton = new MessageButton().setStyle("green").setID('yes_fc').setLabel("Accept")
        let noButton = new MessageButton().setStyle("red").setID('no_fc').setLabel("Decline")
        let row = new MessageActionRow().addComponents([yesButton, noButton])
        const confirmation = await message.channel.send({
            embed: {
                title: 'Confirmation',
                color: 'YELLOW',
                description: `${user2}, ${user1} has challenged you for a game of fast click.\nWhat do you say?`,
                timestamp: new Date(),
            },
            components: [
                row
            ]
        })
        const confirmationCollector = confirmation.createButtonCollector(
            b => b,
            {
                time: 30000,
            }
        )

        confirmationCollector.on('collect', async button => {
            if(button.clicker.id !== user2.id){
               return button.reply.send('This is not for you.')
            }

            if(button.id === 'yes_fc'){
                button.reply.defer()
                yesButton = yesButton.setDisabled()
                noButton = noButton.setStyle("grey").setID('no_fc').setDisabled()
                row = new MessageActionRow().addComponents([yesButton, noButton])
                confirmation.edit({ embed: {
                title: 'Challenge Accepted',
                color: 'GREEN',
                description: `${user2}, ${user1} has challenged you for a game of fast click.\nWhat do you say?`,
                timestamp: new Date(),
            }, components: row })

            const mainMessage = await message.channel.send(`Alright! The button will `)
            } else {
                button.reply.defer()
                yesButton = yesButton.setStyle("grey").setID('yes_fc').setDisabled()
                noButton = noButton.setDisabled()
                row = new MessageActionRow().addComponents([yesButton, noButton])
                confirmation.edit({ embed: {
                title: 'Challenge Declined',
                color: 'RED',
                description: `${user2}, ${user1} has challenged you for a game of fast click.\nWhat do you say?`,
                timestamp: new Date(),
            }, components: row })
            return;
            }
        })
    }
}