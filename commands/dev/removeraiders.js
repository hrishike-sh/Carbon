module.exports = {
    name: 'removeraiders',
    aliases: ['deleteraiders', 'fuckraid', 'HELPIMGETTINGRAIDEDAA'],
    description: 'Kicks all the new members who have joined in the last __x__ minutes/hours.',
    async execute(message, args, client){
        if(!['598918643727990784', '619339277993639956'].includes(message.author.id)) return;
        if(!args[0]) return message.channel.send("You have to provide valid time.")
        const time = ms(args[0])
        
        message.guild.members.cache.filter(mem => mem.createdTimestamp - mem.joinedTimestamp < time).forEach(mem => {
            mem.kick(`Raider. Action requested by ${message.author.tag}`)
        })
    }
}