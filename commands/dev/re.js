module.exports = {
    name: 're',
    aliases: ['re-emit'],
    async execute(message, args, client){
        if(!args[0]) return message.channel.send(`Give valid message link(s).`)

        console.log(args)
    }
}