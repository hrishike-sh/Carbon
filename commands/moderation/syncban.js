module.exports = {
    name: 'syncban',
    async execute(message, args){
        const allowedUsers = ['598918643727990784']
        if(!allowedUsers.includes(message.author.id)) return;

        // check for valid user 
        if(!args[0]) return message.chanenl.send({ embed:{ description: '[Where user?](https://i.imgur.com/dNJrNXI.png)'}})
        const user = message.mentions.users.size > 0 ? message.mentions.users.first().id : args[0]
    }
}
