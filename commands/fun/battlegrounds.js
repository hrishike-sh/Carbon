const { Client, Message, MessageEmbed } = require('discord.js');
const { MessageButton } = require("discord-buttons")
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
            joined.push(button.clicker.user.id)

            gamedata.push({
                member: button.clicker.member,
                hp: 100,
                dead: false,
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
                    .addField("Actions", "1) Defense Up\n> This will increase HP (default: 100).\n2) Upgrade Weapon\n> This will increase the damage of your Gun (default: 35)")
            )
        })
    }
}