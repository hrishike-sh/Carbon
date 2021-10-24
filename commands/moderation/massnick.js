module.exports = {
    name: 'massnick',
    aliases: ['dis'],
    usage: '--has {Text to check for} --rename {New nick for the users}',
    async execute(message){
        if(!message.member.permissions.has("ADMINISTATOR")) return message.channel.send("You must have ADMINISTATOR perms to perform this action.")

        const args = message.content.slice('fh '.length).trim().split('--')
        console.log(args)

        if(args[0][0].toLowerCase() === 'h'){
            const newArgs = args.split(/ +/g)

            console.log(args)
        }
    }
}