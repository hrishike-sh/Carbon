const ms = require('ms')

module.exports = {
    name: 'removeraiders',
    aliases: ['deleteraiders', 'fuckraid', 'HELPIMGETTINGRAIDEDAA'],
    description: 'Kicks all the new members who have joined in the last __x__ minutes/hours.',
    async execute(message, args, client){
        if(!['598918643727990784', '619339277993639956', '264186213848580096', '450864876416401419'].includes(message.author.id)) return;
        if(!args[0]) return message.channel.send("You have to provide valid time.")
        const time = ms(args[0])
        
        const size = message.guild.members.cache.filter(mem => message.createdTimestamp - mem.joinedTimestamp < time).size

        message.channel.send(`Are you sure you want to kick **${size.toLocaleString()}** members?\nReply with \`yes\` or \`no\``)
        const collector = message.channel.createMessageCollector(msg => msg.author.id === message.author.id, { max: 1 })

        collector.on('collect', async message => {
            if(message.content.toLowerCase() === 'yes'){
                let kicked = 0;
                let failed = 0;
                await message.guild.members.cache.filter(mem => message.createdTimestamp - mem.joinedTimestamp < time).forEach(mem => {
                    try{
                        mem.kick(`Raider. Requested by ${message.author.tag}(${message.author.id})`)
                        kicked++
                    } catch (e){
                        failed++
                    }
                })

                return message.channel.send(`Done! Kicked a total of ${kicked.toLocaleString()} members.\nFailed to kick ${failed} members.`)
            } else {
                message.channel.send('Okay, wont kick those members.')
            }

        })

        
    }
}