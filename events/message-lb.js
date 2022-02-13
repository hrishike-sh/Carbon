
const { Message, Client, Collection } = require("discord.js")

module.exports = {
    name: "messageCreate",
    /**
     * 
     * @param {Message} message 
     * @param {Client} client 
     */
    async execute(message, client){
        if(message.guild.id !== '824294231447044197') return;
        if(message.author.bot) return;
        
        const messages = client.db.messages

        if(!messages.has(message.author.id)){
            messages.set(message.author.id, {
                messages: 0
            })
        }
        
        const user = messages.get(message.author.id)
        user.messages++

        return;
    }
}