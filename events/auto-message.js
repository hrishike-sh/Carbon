module.exports = {
    name: 'message',
    async execute(message, client){
        if(message.channel.id !== '869217430533206027') return;

        if(!message.content.toLowerCase().startsWith('pls')) return;

        const args = message.content.toLowerCase().trim().split(/ +g/)

        if(!args[1] || !['share', 'give'].includes(args[1].toLowerCase())) return;

        const filter = (message) => message.author.id === '270904126974590976' && message.mentions.users.size > 0 && message.content.includes("You gave")
        message.channel.awaitMessages(filter, { time: 60000 }).then(messages => {
            console.log(messages)
        })
    }
}