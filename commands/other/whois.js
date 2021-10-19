
module.exports = {
    name: 'whois',
    aliases: ['wi'],
    usage: 'user_id',
    description: 'Shows mutuals and userinfo about a certain user.',
    async execute(message, args, client){
        let userid = message.mentions.users.size > 0 ? message.mentions.users.first() : args[0]

        if(!userid) userid = message.author.id
        if(client.users.cache.get(userid)) return message.channel.send(`The user_id was not found.`)

        let results = '';
        for(const guild of client.guilds.cache.size){
            if(guild.members.cache.has(userid)) results.push(`${guild.id}\n`)
        }
        message.channel.send(results)
    }
}