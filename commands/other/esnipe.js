const ms = require('ms')

module.exports = {
    name: 'esnipe',
    aliases: ['editsnipe'],
    description: 'Dank Memer esnipe but better',
    execute(message, args, client){
        const sniped = client.esnipes.get(message.channel.id)
        if(message.guild.id === '824294231447044197'){
          if(
            !message.member.roles.cache.some(role => role.id === '839803117646512128') &&
            !message.member.roles.cache.some(role => role.id === '826196972167757875') &&
            !message.member.roles.cache.some(role => role.id === '825283097830096908') &&
            !message.member.roles.cache.some(role => role.id === '824687393868742696')
        ){
            return message.channel.send("You do not have permission to use this command, read <#843943148945276949> for more info.")
        }
        }
        

        if(!sniped || sniped == undefined){
            return message.channel.send("There is nothing to be sniped.")
        }

        message.channel.send({ embed: {
            author: {
                name: sniped.tag,
                icon_url: sniped.member.user.displayAvatarURL({ dynamic: false }) 
            },
            fields: [
                {
                    name: 'Old Message',
                    value: sniped.oldContent,
                    inline: true
                },
                {
                    name: 'New Message',
                    value: sniped.newContent,
                    inline: true
                }
            ],
            footer: {
                text: `Sniped by ${message.author.tag} | Message was edited in ${ms(sniped.editedIn, { long: true })}`
            }
        }})
    }
}