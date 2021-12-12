const { Client, Message, MessageEmbed } = require('discord.js');
const { MessageButton, MessageActionRow } = require("discord-buttons")
module.exports = {
    name: 'battlegrounds',
    aliases: ['pubg', 'fortnite', 'bg', 'arena'],
    fhOnly: false,
    disabledChannels: [],
    /** 
     * @param {Client} client 
     * @param {Message} message 
     * @param {String[]} args 
     */
    async execute(message, args, client) {

        if (!message.member.permissions.has("ADMINISTRATOR")) {
            message.channel.send("Admin only command lol")
            return
        }

        const joinBut = new MessageButton()
            .setLabel("Join")
            .setEmoji("⚔️")
            .setID("join-bg")
            .setStyle('green')

        const joinMessage = await message.channel.send({
            embed: new MessageEmbed()
                .setTitle("Battlegrounds")
                .setDescription("Click the button to join the game.\nThe game starts in **30 seconds**.")
                .setColor("YELLOW"),
            component: joinBut
        })

        const joinCollector = joinMessage.createButtonCollector(
            b => b,
            {
                time: 30 * 1000,
            }
        );
        let joined = [];
        let gamedata = [];

        joinCollector.on("collect", async button => {
            if (joined.includes(button.clicker.user.id)) {
                button.reply.send("You have already joined the game.", true)
                return
            }
            if (joined.length > 20) {
                button.reply.send("The game is full (20)", true)
                return
            }
            joined.push(button.clicker.user.id)

            gamedata.push({
                member: button.clicker.member,
                id: Math.random().toString(36).substring(2),
                hp: 100,
                dead: false,
                gun: {
                    dmg: 35
                },
                inv: {
                    shield: {
                        count: 0
                    }
                }
            })
            button.reply.send("You have joined the game!", true)
        });

        joinCollector.on("end", async () => {
            await message.channel.send(
                new MessageEmbed()
                    .setColor("RED")
                    .setTitle("Game Information")
                    .setDescription("The game will start soon, you may read the instructions till then.")
                    .addField("How it works", "The bot will randomly choose a player, and the player has to decide what they have to do.")
                    .addField("Actions", "1) **Defense Up**\n> This will increase HP (default: 100).\n2) **Upgrade Weapon**\n> This will increase the damage of your Gun (default: 35)\n3) **Search**\n> Try your luck and search for something")
                    .addField("Searching", "You can search for buffs, or get bit by a snake.\n**BUFFS:**\n1) Shield: You're immune to all incoming damage for 1 turn. (Can stack)")
                    .setTimestamp()
                    .setFooter("The game will start soon...", client.user.displayAvatarURL())
            )
            /**
             * Init game
             */
            let row1 = new MessageActionRow()
            let row2 = new MessageActionRow()
            let row3 = new MessageActionRow()
            let row4 = new MessageActionRow()

            let i;

            for (i = 0; i < joined.length; i++) {
                if (i < 5) {
                    row1 = row1.addComponent(
                        new MessageButton()
                            .setLabel(gamedata[i].member.user.username)
                            .setStyle("grey")
                            .setID(gamedata[i].id)
                    )
                } else if (i < 10) {
                    row2 = row2.addComponent(
                        new MessageButton()
                            .setLabel(gamedata[i].member.user.username)
                            .setStyle("grey")
                            .setID(gamedata[i].id)
                    )
                } else if (i < 15) {
                    row3 = row3.addComponent(
                        new MessageButton()
                            .setLabel(gamedata[i].member.user.username)
                            .setStyle("grey")
                            .setID(gamedata[i].id)
                    )
                } else {
                    row4 = row4.addComponent(
                        new MessageButton()
                            .setLabel(gamedata[i].member.user.username)
                            .setStyle("grey")
                            .setID(gamedata[i].id)
                    )
                }
            }
            let components = [];
            if (i < 4) components.push(row1)
            if (i > 4) components.push(row1, row2)
            if (i > 9) components.push(row3)
            if (i > 14) components.push(row4)


            // if(i > )

            /**
             * Init game
             */
            await sleep(5000)
            const mainMessage = await message.channel.send({
                embed: new MessageEmbed()
                    .setTitle("Battlegrounds")
                    .setDescription("Click on the user to see their stats!"),
                components,
            })
            const infoCollector = mainMessage.createButtonCollector(
                b => b
            )

            infoCollector.on("collect", async button => {
                const buttonId = button.id
                const userInfo = gamedata.filter(val => val.id === buttonId)[0]
                const blank = '<:blank:914473340129906708>'

                await button.reply.send(`${userInfo.member}'s stats:\n${blank}HP: **${userInfo.hp}**\n${blank}Gun Damage: **${userInfo.gun.dmg}**`, true)
            })
        })
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}