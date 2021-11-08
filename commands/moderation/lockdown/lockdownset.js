const db = require('../../database/models/settingsSchema')

module.exports = {
    name: 'lockdownset',
    aliases: ['lockdownsetting', 'lds', 'lockset'],
    async execute(message, args){

        // fh lockset add #channel #channel2 ...
        // fh lockset remove #channel #channel2 ...
        // fh lockset clear
        // fh lockset message [message]

        let serversettings = await db.findOne({ guildID: message.guild.id })
        
        if(!serversettings) {
            serversettings = new db({
                guildID: message.guild.id,
            }).save()
        }

        if(!args[0]) return message.channel.send(`Please tell me what to do, run \`fh lockset help\` to know the list of commands.`)

        if(args[0] === 'help'){

        }

        const todo = args[0].toLowerCase()

        if(todo === 'message'){
            args.shift()
            if(!args[0]){
                if(serversettings.lockdownSet.message){
                    return message.channel.send({
                        embed: {
                            title: 'Current Message',
                            color: "BLACK",
                            description: serversettings.lockdownSet.message
                        }
                    })
                } else {
                    return message.channel.send(`Please provide a message to display while the server is locked.`)
                }
            } else {
                serversettings.lockdownSet.message = args.join(" ")

                return message.channel.send("Done, the lockdown message is set!\nThe embed will look something like this:", {
                    embed: {
                        title: ":lock: **Server Lockdown**",
                        color: "RED",
                        description: serversettings.lockdownSet.message,
                        footer: {
                            text: "Please check back later!"
                        }
                    }
                })
            }
        }

    }
}