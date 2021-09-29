module.exports = {
    name: 'messageUpdate',
    once: false,
    execute(oldMessage, newMessage, client){
        if(message.author.bot) return;

        client.esnipes.set(message.channel.id, {
            oldContent: oldMessage.content,
            newContent: newMessage.content,
            editedIn: oldMessage.createdAt - newMessage.editedAt,
            member: newMessage.member,
            tag: newMessage.author.tag
        })
    }
}