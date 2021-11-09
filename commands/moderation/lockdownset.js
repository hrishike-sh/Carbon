const db = require('../../database/models/settingsSchema')

module.exports = {
    name: 'lockdownset',
    aliases: ['lockdownsetting', 'lds', 'lockset'],
    async execute(message, args){

        // fh lockset add #channel #channel2 ...
        // fh lockset remove #channel #channel2 ...
        // fh lockset list
        // fh lockset clear
        // fh lockset message [message]
        if(message.author.id !== '598918643727990784') return
        let serversettings = await db.findOne({ guildID: message.guild.id })
        
        if(!serversettings) {
            serversettings = new db({
                guildID: message.guild.id,
            }).save()
        }

        const helpbed = {
            title: "Lockdown Settings Help",
            description: 'For further help please dm Hrishikesh#0369\n\nCurrent commands are: \`fh lds add\` \`fh lds remove\` \`fh lds list\` \`fh lds clear\` \`fh lds message\`',
            fields: [
                {
                    name: "fh lds add",
                    value: `This command __adds__ a channel(s) to the list, if no channel is #tagged, it will select the current channel, you can provide multiple channels by tagging them.`,
                },
                {
                    name: 'fh lds remove',
                    value: 'This command __removes__ channel(s) from the list, if no channel is #tagged, it will select the current channel, you can provide multiple channels by tagging them.',
                },
                {
                    name: 'fh lds list',
                    value: "Shows all the current channels that will be locked down.",
                },
                {
                    name: 'fh lds clear',
                    value: 'Removes __all__ the channels from the lockdown list, this change is **irreversible**.',
                },
                {
                    name: 'fh lds message',
                    value: 'Set the message that will be showed when the server is locked, if no arguments are provided, it will show the current message if any.'
                }
            ],
            color: 'BLUE',
            footer: {
                text: 'L'
            },
            timestamp: new Date()
        }

        if(!args[0]) return message.channel.send(`Please tell me what to do, run \`fh lockset help\` to know the list of commands.`)

        if(args[0] === 'help'){
            return message.channel.send({ embed: helpbed})
        }

        const todo = args[0].toLowerCase()

        if(todo === 'message'){
            args.shift()
            if(!args[0]){
                if(serversettings.lockdownSet.message){
                    return message.channel.send({
                        embed: {
                            title: 'Current Message: ',
                            color: "BLACK",
                            description: serversettings.lockdownSet.message
                        }
                    })
                } else {
                    return message.channel.send(`Please provide a message to display while the server is locked.`)
                }
            } else {
                serversettings.lockdownSet.message = args.join(" ")
                serversettings.save()
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
        } else if (todo === 'add'){
            args.shift()
            let channels = []
            if(!args[0]){
                if(serversettings.lockdownSet.channels.includes(message.channel.id)){
                    message.channel.send(`This channel is already in the list of channels to be locked!`)
                    return;
                } else {
                    serversettings.lockdownSet.channels.push(message.channel.id)
                    serversettings.save()

                    return message.channel.send(`${message.channel} has been added to the lockdown list.\nType \`fh lds list\` to check all the channels.`)
                }
            } else {
                if(message.mentions.channels.size > 1){
                    message.mentions.channels.forEach(channel => {
                        if(serversettings.lockdownSet.channels.includes(channel.id)){
                            message.channel.send(`<#${channel.id}> was already in the list.`)
                        } else {
                            channels.push(channel.id)
                        }
                    })

                    if(serversettings.lockdownSet.channels.length){
                        serversettings.lockdownSet.channels = serversettings.lockdownSet.channels.concat(channels)
                    } else {
                        serversettings.lockdownSet.channels = channels
                    }
                    serversettings.save()
                    let arr = [];
                    serversettings.lockdownSet.channels.forEach(a => {
                        arr.push(`<#${a}>`)
                    })
                    return message.channel.send(`Done! Updates have been made.`, {
                        embed: {
                            title: 'The channels that will be locked: ',
                            description: `${arr.join(', ')}`,
                            color: "RANDOM"
                        }
                    })
                } else if(message.mentions.channels.first()){
                    const id = message.mentions.channels.first().id
                    if(serversettings.lockdownSet.channels.includes(id)){
                        return message.channel.send(`<#${id}> was already there in the list.`)
                    } else {
                        serversettings.lockdownSet.channels.push(id)
                        serversettings.save()

                        return message.channel.send(`Done, added <#${id}> to the list.`)
                    }
                } else {
                    return message.channel.send(`Please tag the channel, example: <#${message.channel.id}>`)
                }
            }
        } else if (todo === 'remove'){
            args.shift()
            let channels = []
            if(!args[0]){
                if(serversettings.lockdownSet.channels.includes(message.channel.id)){
                    serversettings.lockdownSet.channels = serversettings.lockdownSet.channels.filter(channel => channel !== message.channel.id)
                    serversettings.save()

                    return message.channel.send(`Done! Removed <#${message.channel.id}> channel from the lockdown list`)
                } else {
                    return message.channel.send(`Which channel do you want me to remove, please specify that.`)
                }
            } else {
                if(message.mentions.channels.size > 1){
                    message.mentions.channels.forEach(channel => {
                        if(!serversettings.lockdownSet.channels.includes(channel.id)){
                            message.channel.send(`<#${channel.id}> was not in the list.`)
                        } else {
                            channels = channels.filter(channel => channel !== channel.id)
                        }
                    })

                    if(serversettings.lockdownSet.channels.length){
                        for(i = 0; i < channels.length; i++){
                            serversettings.lockdownSet.channels = serversettings.lockdownSet.channels.filter(channel => !serversettings.lockdownSet.channels.includes(channels[i]))
                        }
                    }
                    serversettings.save()
                    let arr = [];
                    serversettings.lockdownSet.channels.forEach(a => {
                        arr.push(`<#${a}>`)
                    })
                    return message.channel.send(`Done! Updates have been made.`, {
                        embed: {
                            title: 'The channels that will be locked: ',
                            description: `${arr.join(', ')}`,
                            color: "RANDOM"
                        }
                    })
                }
            }
        } else if(todo === 'list'){
            if(!serversettings.lockdownSet.channels) return message.channel.send(`No channels are added to the list`)

            return message.channel.send({ embed: {
                title: 'Channels',
                description: `${serversettings.lockdownSet.channels.map(chan => `<#${chan}>`).join(", ")}`,
                color: "GREEN",
                timestamp: new Date()
            }})
        } else if(todo === 'clear'){
            serversettings.lockdownSet.channels = []
            serversettings.save()
            return message.channel.send(`Done, the list is now cleared`)
        } else {
            return message.channel.send({ embed: helpbed})
        }

    }
}