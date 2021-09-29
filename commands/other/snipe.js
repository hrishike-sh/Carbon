module.exports = {
    name: 'snipe',
    async execute(message, args, client){
        const sniped = client.snipes.get(message.channel.id)
        if(!sniped || sniped == undefined){
          message.channel.send("There is nothing to snipe!")
          return;
        }

        message.channel.send({embed: {
          author: {
              name: sniped.author,
              url: member.displayAvatarURL({ dynamic: false })
          },
          description: sniped.content ? sniped.content : "Probably an image.",
        }})
    }
}