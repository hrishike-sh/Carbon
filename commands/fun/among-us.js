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
            client.emojis.cache.get("917726679214985246").toString(),
            client.emojis.cache.get("917726744457383936").toString(),
            client.emojis.cache.get("917726831485026314").toString(),
            client.emojis.cache.get("917726919062077490").toString(),
            client.emojis.cache.get("917726981964058624").toString(),
            client.emojis.cache.get("917727061651640350").toString(),
            client.emojis.cache.get("917727115183530044").toString(),
            client.emojis.cache.get("917727205453365278").toString(),
            client.emojis.cache.get("917727491660083220").toString(),
            client.emojis.cache.get("917727535704457237").toString()
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
            joined.push(button.clicker.user.id)
            gamedata.push({
                member: button.clicker.member,
                color: emojiArray[i],
                dead: false,
                impostor: false,
                id: `${emojiArray[i]}_${Math.floor(Math.random() * 1_000_000)}`
            })
            i++
            button.reply.send(`You have successfully joined the game and you are: ${client.emojis.cache.get(emojiArray[i]).toString()}`, true)
        })

        takePlayersCollector.on('end', async collected => {
            const amountOfPlayers = gamedata.length
            console.log(gamedata)
            // if(amountOfPlayers < 4){
            //     message.channel.send(`You need atleast **4 players** to play the game, get more friends lol.`)
            //     return
            // }

            const randomNumber = Math.floor(Math.random() * gamedata.length)
            gamedata[randomNumber].impostor = true;

            await message.channel.send("I will now be DM'ing all of you with your role in the game, and shush, no snitching!")

            for (let z = 0; z < gamedata.length; z++) {
                await sleep(500)
                gamedata[z].member.send(`Your role is: **${gamedata[z].impostor ? "Impostor" : "Crewmate"}**`)
            }

            let row1 = new MessageActionRow()
            let row2 = new MessageActionRow()
            let m;
            for (m = 0; m < gamedata.length; m++) {
                if (m < 5) {
                    row1 = row1.addComponent(
                        new MessageButton()
                            .setLabel(gamedata[m].member.user.username)
                            .setStyle("grey")
                            .setID(gamedata[m].id)
                            .setEmoji(gamedata[m].color)
                    )
                } else {
                    row2 = row2.addComponent(
                        new MessageButton()
                            .setLabel(gamedata[m].member.user.username)
                            .setStyle("grey")
                            .setID(gamedata[m].id)
                            .setEmoji(gamedata[m].color)
                    )
                }
            }

            const components = m < 5 ? [row1] : [row1, row2]

            await message.channel.send("**How does the impostor win?**\n> The impostor has to send **15** messages in order to win or they have to not get caught for 2 minutes.\n\n**How do the crewmates win?**\n> The crewmates will have to work together to find out who the impostor is!\n\n**How do I call an emergency meeting?**\n> IDK either, its not coded yet...", {
                components
            })

            const mainCol = message.channel.createMessageCollector(
                m => joined.includes(m.author.id),
                {
                    time: 120 * 1000
                }
            )
            let impostorMessages = 0;
            let meetings = 5;
            mainCol.on('collect', async msg => {
                const user = gamedata.filter(value => value.member.id === msg.author.id)[0]
                console.log(user.impostor)
                if (user.impostor) {
                    impostorMessages++
                }
                if (user.impostor && impostorMessages > 3) {
                    mainCol.stop("impostor")

                    return message.channel.send(`After baiting a lot, and managing to not get caught, ${user.member} managed to send more than 15 messages...\n\nAll of the crewmates get killed and the ultimate winner is the impostor, which is ${user.member}!`)
                }



            })
        })
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}