module.exports = {
    name: 'messageDelete',
    once: false,
    execute(message, client){
        client.snipes.set(message.channel.id, {
            content: message.content,
            author: message.author.tag,
            member: message.member,
        })
    }
}