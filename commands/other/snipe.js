module.exports = {
    name: 'snipe',
    async execute(message, args, client){
        const sniped = client.snipes.get(message.channel.id)
        if(
            !message.member.roles.cache.some(role => role.id === '839803117646512128') &&
            !message.member.roles.cache.some(role => role.id === '826196972167757875') &&
            !message.member.roles.cache.some(role => role.id === '825283097830096908') &&
            !message.member.roles.cache.some(role => role.id === '824687393868742696')
        ){
            return message.channel.send("You do not have permission to use this command, read <#843943148945276949> for more info.")
        }
        if(!sniped || sniped == undefined){
          message.channel.send("There is nothing to snipe!")
          return;
        }

        message.channel.send({embed: {
          author: {
              name: sniped.author,
              icon_url: sniped.member.user.displayAvatarURL({ dynamic: false })
          },
          description: sniped.content ? sniped.content : `[One attachment found.](${sniped.attachments})`,
          color: 'RED',
          footer: {
              text: `Sniped by ${message.author.tag} | Deleted ${sniped.deletedAt}`
          }
        }})
    }
}