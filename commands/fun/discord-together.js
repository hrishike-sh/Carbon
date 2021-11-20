
module.exports = {
    name: 'discord-together',
    aliases: ['dt'],
    async execute(message, args, client) {
        if (message.author.id !== '598918643727990784') return message.channel.send(`You are not hrish go away.`)

        client.discordTogether.createTogetherCode(message.member.voice.channel.id, 'youtube').then(code => {
            return message.channel.send(code.code)
        })
    }

}