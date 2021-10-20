module.exports = {
    name: 'checkban',
    aliases: ['cb', 'fhml'],
    async execute(message, args, client){
        const fh = client.guilds.cache.get("824294231447044197")
        if(message.guild.id !== '845215901657071647') return;
        if(!args[0]) return message.channel.send("Please provide the user id.")

        const id = message.mentions.users.size > 0 ? message.mentions.users.first().id : args[0]

        const ban = await fh.fetchBan(id).catch(e => {
            return message.channel.send(`Either the provided user is not banned or the user id is invalid.`)
        })

        if(!ban) return;

        message.channel.send({embed: {
            title: 'Ban Info',
            color: 'RED',
            description: `User: \`${ban.user.tag}\`(\`${ban.user.id}\`)`,
            fields: [
                {
                    name: 'Reason',
                    value: ban.reason
                }
            ]
        }})
    }
}