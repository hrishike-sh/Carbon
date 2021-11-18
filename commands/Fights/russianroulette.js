
const channels = []
const {
    MessageButton, MessageActionRow
} = require('discord-buttons')
module.exports = {
    name: 'russianroulette',
    aliases: ['rr'],
    async execute(message, args){
        if(channels.includes(message.channel.id)){
            return message.channel.send(`This channel already has a game active.`)
        }

        const joinBut = new MessageButton().setLabel("Join").setEmoji("⚔️").setID("join-rr").setStyle('green')
        const infoBut = new MessageButton().setLabel("Info").setEmoji("ℹ️").setID("info-rr").setStyle('grey')
        const row = new MessageActionRow().addComponents([joinBut, infoBut])
        const joinMessage = await message.channel.send({ embed: {
            title: 'Russian Roulette',
            description: 'Click the button to join the game!',
            color: 'GREEN',
        }, components: row })

    }
}