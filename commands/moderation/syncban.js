const {
    MessageEmbed
} = require('discord.js')
const {
    MessageButton,
    MessageActionRow,
} = require('discord-buttons')
module.exports = {
    name: 'syncban',
    async execute(message, args, client){
        const allowedUsers = ['598918643727990784']
        if(!allowedUsers.includes(message.author.id)) return;

        // check for valid user 
        if(!args[0]) return message.channel.send({ embed:{ color: 'RED', description: '[Where user?](https://i.imgur.com/dNJrNXI.png)'}})
        const user = message.mentions.users.size > 0 ? message.mentions.users.first().id : args[0]
        if(!client.users.cache.get(user)) return message.channel.send("Not a valid user.")
        const finalUser = client.users.cache.get(user)
        // weird and random checks
        if(user === '598918643727990784'){
            //hrish
            return message.channel.send("DONT BAN HRISH YOU...")
        } else if (user === '643737383967260673'){
            //niha
            return message.channel.send("Youre not banning her")
        } else if (user === '619339277993639956'){
            //strafe
            return message.channel.send("No.")
        } else if (user === message.author.id){
            //self
            return message.channel.send("I dont promote self harm.")
        } else if (user.bot){
            //bot
            return message.channel.send("You are not banning my kind.")
        } else if (user === client.user.id){
            //BANNING THE BOT JIAF SJFA SA FKA SFSA SFKN ASF
            return message.channel.send("brb, banning you.")
        } else {
            const cache = client.guilds.cache

            let yesbut = new MessageButton()
                .setLabel("Yes")
                .setStyle("green")
                .setID("globalbanyes")
            let nobut = new MessageButton()
                .setLabel("No")
                .setStyle("red")
                .setID("globalbanno")
            const row = new MessageActionRow().addComponents([yesbut, nobut])
            const confirmation = await message.channel.send({embed: {
                title: 'Are you sure?',
                color: "RED",
                timestamp: new Date(),
                description: `This will ban <@${user}>(${finalUser.tag}) from a total of **${cache.size}** servers.`
            }, components: [row]})
            const collector = confirmation.createButtonCollector(b => b, {time: 3e4})

            collector.on('collect', async (but) => {
                if(but.clicker.user.id !== message.author.id){
                    await but.reply.send("This is not for you.", true)
                    return;
                }

                if(but.id === 'globalbanno'){
                    const msg = message.channel.send("You really got my hopes up there, nevermind i guess.")
                    message.delete()
                    confirmation.delete()
                    await sleep(2500)
                    msg.delete()
                } else if(but.id === 'globalbanyes'){
                    await but.reply.send("Banning...", true)
                    const errorArray = []
                    let bannedFrom;
                    try {
                        cache.forEach(guild => {
                            guild.members.fetch({ user, force: true }).then(m => {
                                try {
                                    m.ban({ reason: "Test global ban"})
                                    bannedFrom++
                                } catch(e) {
                                    --bannedFrom
                                    errorArray.push(e)
                                }
                            })
                        })
                    } catch (error) {
                        message.channel.send("Something went wrong.")
                        console.log(error)
                    } finally {
                        const finalError = errorArray.join("\n")

                        message.channel.send({ 
                            embed: {
                                title: "Global ban done",
                                fields: [
                                    {
                                        name: "Successfully banned in:",
                                        value: `${bannedFrom} servers.`
                                    },
                                    {
                                        name: "Failed in:",
                                        value: `${errorArray.length} servers.\n\`\`\`${finalError}\`\`\``
                                    }
                                ]
                            }
                        })

                    }


                }
            })
        }

        
    }
}

function sleep(ms){
  return new Promise(resolve => setTimeout(resolve, ms))
}