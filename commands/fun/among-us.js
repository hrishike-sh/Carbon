const { Client, Message, MessageEmbed } = require('discord.js');
const { MessageButton, MessageActionRow } = require('discord-buttons')
module.exports = {
    name: 'amongus',
    aliases: ['amogus'],
    fhOnly: false,
    disabledChannels: [],
    /** 
     * @param {Client} client 
     * @param {Message} message 
     * @param {String[]} args 
     */
    async execute(message, args, client) {

        if (message.author.id !== '598918643727990784') {
            return
        }

        const emojis = [
            '<:amongus_red:917726679214985246>',
            '<:amongus_orange:917726744457383936>',
            '<:amongus_yellow:917726831485026314>',
            '<:amongus_green:917726919062077490>',
            '<:amongus_lime:917726981964058624>',
            '<:amongus_blue:917727061651640350>',
            '<:amongus_cyan:917727115183530044>',
            '<:amongus_purple:917727205453365278>',
            '<:amongus_white:917727491660083220>',
            '<:amongus_black:917727535704457237>'
        ]
        const emojiArray = [
            '917726679214985246',
            '917726744457383936',
            '917726831485026314',
            '917726919062077490',
            '917726981964058624',
            '917727061651640350',
            '917727115183530044',
            '917727205453365278',
            '917727491660083220',
            '917727535704457237'
        ]

        const joinBut = new MessageButton().setLabel("Join").setID("join-amongus").setStyle('green')
        const infoBut = new MessageButton().setLabel("Info").setID("info-amongus").setStyle('grey')
        const row = new MessageActionRow().addComponents([joinBut, infoBut])

        const takePlayers = await message.channel.send({
            embed: new MessageEmbed()
                .setTitle("Among Us")
                .setDescription("The game will begin in **30 seconds**\nOnly the first 10 people will be counted in!"),
            components: [row]
        })

        const takePlayersCollector = takePlayers.createButtonCollector(
            b => b,
            {
                time: 30 * 1000
            }
        )

        const joined = []
        let gamedata = []
        let i = 0;

        takePlayersCollector.on('collect', button => {

            if (joined.includes(button.clicker.user.id)) {
                button.reply.send("You have already joined.", true)
                return
            }
            if (i > 10) {
                button.reply.send("The game is already full, too late.", true)
                return
            }
            i++
            gamedata.push({
                member: button.clicker.member,
                color: emojiArray[i],
                dead: false,
                impostor: false,
                id: `${emojiArray[i]}_${Math.floor(Math.random() * 1_000_000)}`
            })
            button.reply.send(`You have successfully joined the game and you are: ${emojis[i]}`)
        })

        takePlayersCollector.on('end', async collected => {
            const amountOfPlayers = gamedata.length

            // if(amountOfPlayers < 4){
            //     message.channel.send(`You need atleast **4 players** to play the game, get more friends lol.`)
            //     return
            // }

            const randomNumber = Math.floor(Math.random() * gamedata.length)
            gamedata[randomNumber].impostor = true;

            await message.channel.send("I will now be DM'ing all of you with your role in the game, and shush, no snitching!")

            for (let z = 0; z < gamedata.length; z++) {
                await sleep(500)
                gamedata[i].member.send(`Your role is: **${gamedata[i].impostor ? "Impostor" : "Crewmate"}**`)
            }

            let row1 = new MessageActionRow()
            let row2 = new MessageActionRow()

            for (let m = 0; m < gamedata.length; m++) {
                if (m < 5) {
                    row1 = row1.addComponent(
                        new MessageButton()
                            .setLabel(gamedata[m].member.user.username)
                            .setStyle("grey")
                            .setID(gamedata[i].id)
                    )
                } else {
                    row2 = row2.addComponent(
                        new MessageButton()
                            .setLabel(gamedata[m].member.user.username)
                            .setStyle("grey")
                            .setID(gamedata[i].id)
                    )
                }
            }
        })
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}