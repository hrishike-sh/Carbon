module.exports = {
    name: 'messageUpdate',
    once: false,
    execute(oldMessage, newMessage, client) {
        if (newMessage.author.bot) return
        let snipes = client.snipes.esnipes.get(oldMessage.channel.id) || []

        snipes.unshift({
            oldContent: oldMessage.content,
            newContent: newMessage.content,
            editedIn: newMessage.createdAt - oldMessage.editedAt,
            member: newMessage.member,
            author: newMessage.author,
        })

        client.snipes.esnipes.set(oldMessage.channel.id, snipes)
    },
}
