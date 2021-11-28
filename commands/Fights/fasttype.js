const { Client, Message, MessageEmbed } = require('discord.js');
const { MessageButton, MessageActionRow } = require('discord-buttons')
const txtgen = require('txtgen')
module.exports = {
    name: 'fasttype',
    fhOnly: false,
    disabledChannels: [],
    /** 
     * @param {Client} client 
     * @param {Message} message 
     * @param {String[]} args 
     */
    async execute(message, args, client) {
        const target = message.mentions.users.first() || null

        if (!target) return message.channel.send(`You will have to ping someone to play with them bozo`)

        const yesBut = new MessageButton()
            .setID("yes-ft")
            .setLabel("Confirm")
            .setStyle("green")
        const noBut = new MessageButton()
            .setID("no-ft")
            .setLabel("Decline")
            .setStyle("red")
        const row = new MessageActionRow().addComponents([yesBut, noBut])

        const confirmation = await message.channel.send({
            embed: new MessageEmbed()
                .setTitle("Confirmation")
                .setDescription(`${target}, ${message.member} challenges you for a game of fasttype.\nWhat do you say?`)
                .setTimestamp()
                .setFooter("Use the buttons!", client.user.displayAvatarURL()),
            components: [row]
        })

        const confirmationCollector = confirmation.createButtonCollector(b => b, {})

        confirmationCollector.on('collect', async button => {
            const id = button.id

            if (button.clicker.user.id !== target.id) {
                button.reply.send("This is not for you.", true)
                return;
            }

            if (id == 'no-ft') {
                confirmation.deletable()
                confirmationCollector.stop()
                return message.channel.send("This challenge was declined.")
            } else {
                confirmation.delete()
                message.channel.send(`The challenge was accepted, goodluck.`)

                let sentence = txtgen.sentence()
                const rawSentence = sentence
                const emptychar = '‎'
                sentence = sentence.split("")
                sentence = sentence.join(emptychar)
                sentence = sentence.split(" ")

                await message.channel.send(sentence)
            }
        })


    }
}