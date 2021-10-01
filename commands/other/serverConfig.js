const settingsSchema = require('../../database/models/settingsSchema')
let mongoURL;
const mongoose = require('mongoose')
module.exports = {
        name: 'serverConfig',
        aliases: ['config', 'serverconf'],
        description: 'The only command the bot dev doesnt care about, change the server config.',
        args: true,
       async execute(message, args){
                if (!mongoURL) {
                    let dbURL = process.env.mongopath
                    mongoose.connect(dbURL, {
                        useNewUrlParser: true,
                        useUnifiedTopology: true,
                        useFindAndModify: false
                    })
                }
                const hasRole = message.member.roles.cache.find(role => role.permissions.has("ADMINISTRATOR")) ? true : false

                if (!hasRole) return message.channel.send("You must have the \`ADMINISTRATOR\` permission to change the server config.")

                args.shift()
                if (!args[0]) return message.channel.send("Please specify which setting you would like to change.")
                const setting = args[0]
                const possibleSettings = ["donorole", 'logchannel', 'gtnrole'];
                const example = `Example: \`fh config donorole add role_id\` | \`fh config logchannel channel_id\``
                if (!possibleSettings.includes(setting.toLowerCase())) {
                    return message.channel.send("That is not a valid setting.\n\n" + example)
                }
                const guild = await settingsSchema.findOne({
                    guildID: message.guild.id
                })
                if (!guild) {
                    const newGuild = new settingsSchema({
                        guildID: message.guild.id
                    })

                    await newGuild.save().catch(e => {
                        message.channel.send(`There was an error saving this new guild!\nERROR: \`${e}\``)
                    })

                }


                if (setting === 'donorole') {
                    args.shift()
                    if (!args[0]) return message.channel.send("Please specify one of these: \`add\`, \`remove\` or \`clear\`")
                    let todo = args[0].toLowerCase()
                    if (!['add', 'remove', 'clear'].includes(args[0].toLowerCase())) return message.channel.send("Please specify one of these: \`add\`, \`remove\` or \`clear\`")

                    if (todo === 'add') {
                        args.shift()
                        if (!args[0]) return message.channel.send("You must give a valid role id.\nExample: \`fh config donorole add 5932941239242349\`")
                        let roleID = args[0]
                        const validRole = message.guild.roles.cache.some(role => role.id === roleID)
                        if (!validRole) return message.channel.send(`ERROR: I could not find any role with the id \"${roleID}\"`)

                        guild.donationRoles.push(roleID)
                        guild.save()
                        message.channel.send("Done! Added the role id!")
                    } else if (todo === 'remove') {
                        args.shift()
                        if (!args[0]) return message.channel.send("You must give a valid role id.\nExample: \`fh config donorole remove 5932941239242349\`")
                        let roleID = args[0]
                        const validRole = message.guild.roles.cache.some(role => role.id === roleID)
                        if (!validRole) return message.channel.send(`ERROR: I could not find any role with the id \"${roleID}\"`)

                        if (!guild.donationRoles.includes(roleID)) {
                            return message.channel.send("How can I remove something that does not exist, that role is not whitelisted for it to be removed.")
                        }
                        let newData;
                        if (Array.isArray(guild.donationRoles)) {
                            newData = guild.donationRoles.filter((d) => !guild.donationRoles.includes(d))
                        } else newData = guild.donationRoles.filter((d) => d !== guild.donationRoles)

                        guild.donationRoles = newData
                        guild.save()
                        message.channel.send("Removed that role from the whitelist.")

                    } else if (todo === 'clear') {
                        let arr = []
                        guild.donationRoles = arr
                        guild.save()
                        message.channel.send("Removed all the whitelisted roles.")
                    }

                } else if (setting === 'logchannel') {
                    args.shift()
                    const channel = message.channel.id

                    guild.logChannel = channel
                    guild.save()

                    message.channel.send(`Okay, the logs will be sent in <#${channel}>`)
                }
            }
        }