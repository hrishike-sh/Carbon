const ms = require('ms')
const giveawayModel = require('../../database/models/giveaway')
const { MessageButton, MessageActionRow } = require('discord-buttons')
module.exports = {
    name: 'gstart',
    alises: ['g', 'giveaway', 'gaw'],
    description: 'start giveaways (testing only)',
    async execute(message, args, client){
        if(message.author.id !== '598918643727990784') return;

        //fh gstart 10s 1w prize

        let time = args[0]
        if(!time) return message.channel.send("You must specify time.")
        if(isNaN(ms(time))) return message.channel.send("Please specify valid time.")
        args.shift()
        time = ms(time)
        let winners = args[0]
        if(!winners || isNaN(parseInt(winners))) return message.channel.send("You must specify the number of winners.")
        winners = parseInt(winners)

        args.shift()
        let prize = args.join(" ")
        if(!prize) prize = 'Prize'

        if(time > 1){
            // database giveaway
            const enterBut = new MessageButton().setLabel("Enter").setStyle("green").setID("giveaway-join")
            const row = new MessageActionRow().addComponents([enterBut])
            const hrish = await message.channel.send({
                embed: {
                    title: prize,
                    color: 'RANDOM',
                    description: `Use the button to enter!!\nTime: **${ms(time, { long: true })}** (ends <t:${((new Date().getTime() + time) / 1000).toFixed(0)}:R>)\nHosted by: ${message.member}`
                },
                components: [row]
            })
            const gaw = new giveawayModel({
                guildId: message.guild.id,
                channelId: message.channel.id,
                messageId: hrish.id,
                hosterId: message.author.id,
                endsAt: {
                    time: new Date().getTime() + time
                },
                hasEnded: false
            })
            gaw.save()
        } else {
            // regular giveaway
        }

        
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}