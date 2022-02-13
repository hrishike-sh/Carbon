
const { Message, Client, Collection } = require("discord.js")

module.exports = {
    name: "messageCreate",
    /**
     * 
     * @param {Message} message 
     * @param {Client} client 
     */
    async execute(message, client){
        if(message.author.bot) return;
        
        const messages = client.db.messages

        if(!messages.has(message.author.id)){
            messages.set(message.author.id, {
                daily: 0,
                weekly: 0,
                monthly: 0
            })
        }
        
        const user = messages.get(message.author.id)
        user.daily++
        user.weekly++
        user.monthly++

        return;
    }
}