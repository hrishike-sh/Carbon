
const Messages = require('discord-messages');
const settingsSchema = require('../../database/models/settingsSchema')

module.exports = {
    name: 'ddono',
    aliases: ['d', 'dono'],
    usage: 'd <@USER | USER_ID> <Subtract | Add> <Amount>',
    cooldown: 3,
    args: true,
    async execute(message, args) {
        let yesno = false;
        let finalNumm;
        const example = `\n\nExample: \`fh d 598918643727990784 add 5e6\` | \`fh d 598918643727990784 remove 5e6\` | \`fh d 598918643727990784 item banknote 5\``
        const guild = await settingsSchema.findOne({
            guildID: message.guild.id
        })
        if (!guild) return message.channel.send("The server has still not set their whitelisted their roles for this command\nCheck \`fh config\` for more details.")

        if (!guild.logChannel) message.channel.send("It is recommended that you set a log channel for all the donations!\nCheck \`fh config\` for more info!")

        if (guild.donationRoles.length <= 0 || guild.donationRoles.length === 0) return message.channel.send("The server has still not set their whitelisted their roles for this command\nCheck \`fh config\` for more details")
        let canRun = false;

        for (var i = 0; i < guild.donationRoles.length; i++) {
            if (canRun) break;
            canRun = message.member.roles.cache.some(role => role.id === guild.donationRoles[i]) ? true : false
        }
        let a = '';
        guild.donationRoles.forEach(r => {
            a += `<@&${r}>\n`
        })
        if (!canRun) return message.channel.send({
            embed: {
                title: "ERROR",
                description: `You do not have permission to run this command!\nYou must have one of these roles to run it:\n${a}`,
                color: "RED"
            }
        })

        if (!args[0]) return message.channel.send("You must either ping someone or you must give their id" + example)
        const mentionID = message.mentions.users.size > 0 ? message.mentions.users.first().id : args[0]
        args.shift()

        const firstArg = args[0]
        if (!firstArg) return message.channel.send("You must tell me what to do" + example)

        if (firstArg !== 'add' && firstArg !== 'subtract' && firstArg !== 'remove' && firstArg !== '-' && firstArg !== '+' && firstArg !== 'item') {
            return message.channel.send("Invalid response" + example)
        }
        if (firstArg === 'add' || firstArg === '+') {
            let finalNum = 0;
            args.shift()
            if (!args[0]) return message.channel.send("You must provide a number!" + example)
            let number = args[0]
            if (isNaN(parseInt(number[0][0]))) {
                return message.channel.send("Invalid number provided" + example)
            } else {
                if (number.endsWith('k')) {
                    number.replace('k', '')
                    finalNum = parseInt(number) * 1e3
                } else if (number.endsWith('m')) {
                    number.replace('m', '')
                    finalNum = parseInt(number) * 1e6
                } else if (number.endsWith('b')) {
                    number.replace('b', '')
                    finalNum = parseInt(number) * 1e9
                } else {
                    finalNum = Number(number)
                }
            }
            finalNumm = finalNum
            Messages.appendMessage(mentionID, message.guild.id, finalNum)
            message.channel.send(`Added **${finalNum.toLocaleString()}** coins to <@${mentionID}>(${mentionID})'s profile!`)
            yesno = true;
        } else if (firstArg === 'subtract' || firstArg === 'remove' || firstArg === '-') {
            let finalNum = 0
            args.shift()
            if (!args[0]) return message.channel.send("You must provide a number!" + example)
            let number = args[0]
            if (isNaN(parseInt(number[0][0]))) {
                return message.channel.send("Invalid number provided" + example)
            } else {
                if (number.endsWith('k')) {
                    number.replace('k', '')
                    finalNum = parseInt(number) * 1e3
                } else if (number.endsWith('m')) {
                    number.replace('m', '')
                    finalNum = parseInt(number) * 1e6
                } else if (number.endsWith('b')) {
                    number.replace('b', '')
                    finalNum = parseInt(number) * 1e9
                } else {
                    finalNum = Number(number)
                }
            }
            finalNumm = finalNum
            Messages.subtractMessages(mentionID, message.guild.id, finalNum)
            message.channel.send(`Removed **${finalNum.toLocaleString()}** coins from <@${mentionID}>(${mentionID})'s profile!`)
            yesno = true;
        } else if (firstArg === 'item') {
            args.shift()
            if (!args[0]) return message.channel.send("No item id provided" + example)
            const itemID = args[0]
            if (!itemValues[itemID] || itemValues[itemID] === undefined) {
                return message.channel.send({
                    embed: {
                        title: "ERROR",
                        color: 'RED',
                        description: 'Invalid item id was provided, clicl [here](https://discord.com/channels/824294231447044197/863025523772751872/866926449502847016) to see the list of items!'
                    }
                })
            } else {
                let finalNum = 0;
                args.shift()
                if (!args[0]) return message.channel.send("Invalid number of items was provided" + example)
                let itemNumber = args[0]
                if (isNaN(parseInt(itemNumber[0][0]))) {
                    return message.channel.send("Invalid number provided" + example)
                } else {
                    if (itemNumber.endsWith('k')) {
                        itemNumber.replace('k', '')
                        finalNum = parseInt(itemNumber) * 1e3
                    } else if (itemNumber.endsWith('m')) {
                        itemNumber.replace('m', '')
                        finalNum = parseInt(itemNumber) * 1e6
                    } else if (itemNumber.endsWith('b')) {
                        itemNumber.replace('b', '')
                        finalNum = parseInt(itemNumber) * 1e9
                    } else if (itemNumber.includes('e')) {
                        finalNum = eval(itemNumber)
                    } else {
                        finalNum = itemNumber
                    }
                }
                finalNum = parseInt(itemValues[itemID]) * parseInt(finalNum)
                finalNumm = finalNum
                Messages.appendMessage(mentionID, message.guild.id, finalNum)
                message.channel.send(`Added **${finalNum.toLocaleString()}** coins to <@${mentionID}>(${mentionID})'s profile!`)
            }
            yesno = true;
        }

        if (yesno) {
            try {
                message.guild.channels.cache.find(channel => channel.id === guild.logChannel)
                    .send({
                        embed: {
                            title: "Donation Logs",
                            color: 'BLURPLE',
                            description: `[Jump](https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}) to message.`,
                            fields: [{
                                    name: "Responsible Moderator",
                                    value: `${message.author.tag} - ${message.author}`,
                                    inline: true
                                },
                                {
                                    name: "Action",
                                    value: `${firstArg}`,
                                    inline: false
                                },
                                {
                                    name: "Amount",
                                    value: `${finalNumm.toLocaleString()} coins.`,
                                    inline: true
                                },
                            ],
                            timestamp: new Date(),
                            footer: {
                                text: "Donation Tracking"
                            }
                        }
                    })
            } catch (e) {
                console.log(e)
                return message.channel.send("Log channel is not set up by the server. \`fh config\` for more details.")
            }
        }

    }
}
const itemValues = {
    rarepepe: 50000,
    banknote: 80000,
    pizza: 200000,
    pepecoin: 350000,
    pepemedal: 6000000,
    pepecrown: 250000000,
    pepetrophy: 32000000,
    cookie: 2000,
    snow: 2000,
    santashat: 50000,
    toe: 50000,
    foolsnotif: 50000,
    pepestatue: 1000000,
    reversalcard: 3000000,
    jacky: 7500000,
    multi: 13000000,
    lotto: 100000000,
    flower: 100000000,
    beard: 150000000,
    boltcutters: 250000000,
    fakeid: 800,
    sand: 2000,
    laptop: 2000,
    padlock: 2000,
    apple: 3000,
    landmine: 5000,
    alcohol: 5000,
    coinbomb: 8000,
    fishingpole: 10000,
    fidgetspinner: 10000,
    huntingrifle: 10000,
    life: 10000,
    tidepod: 10000,
    horseshoe: 15000,
    wishlist: 15000,
    cheese: 30000,
    normiebox: 50000,
    memebox: 100000,
    dankbox: 150000,
    dailybox: 150000,
    giftbox: 500000,
    godbox: 8000000,
    banhammer: 2000000,
    collar: 10000000,
    ectoplasm: 10000000,
    tipjar: 15000000,
    taco: 20000000,
    stonkmachine: 15000000,
    santasbag: 50000000,
    phone: 1000,
    bread: 15000,
    ant: 50000,
    shovel: 20000,
    trash: 25000,
    chill: 20000,
    golden: 375000,
    skunk: 8500,
    stickbug: 80000,
    rarefish: 20000,
    legendaryfish: 100000,
    candy: 25000,
    deer: 20000,
    duck: 13000,
    exoticfish: 80000,
    commonfish: 3000,
    jellyfish: 55000,
    ladybug: 80000,
    junk: 7500,
}