module.exports = {
    name: 'pingroles',
    aliases: ['proles', 'prole'],
    async execute(message, args){
        if(!message.member.roles.cache.some(role => role.id === '824348974449819658') || message.author.id !== '598918643727990784'){
            message.channel.send("You need the \`・ Administrator\` role to perform this action.")
            return;
        }

        
    }
}