module.exports = {
    name: 're',
    aliases: ['re-emit'],
    async execute(message, args, client){
        if(!args[0]) return message.channel.send(`Give valid message link(s).`)

        const finalArgs = args.join(" ").replace(/https:\/\/discord.com\/channels\//g, '').split(" ")

        finalArgs.forEach(arg => {
            const mainArg = arg.replace(/\//g, " ").split(" ")
            mainArg.shift()

            const channel = client.channels.cache.get(mainArg[0])
            const messagee = channel.messages.fetch(mainArg[1])

            client.emit('message', messagee)

            message.channel.send(`Emmited a message.`)
        })
    }
}