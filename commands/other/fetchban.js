module.exports = {
  name: 'fetchban',
  aliases: ['fetchbans', 'baninfo'],
  args: true,
  usage: '<id>',
  async execute(message, args){
    const id = args[0]
    let banInfo = await message.guild.fetchBan(id).catch(e => {return message.channel.send("Either the user is not banned or the user id provided is not valid.")})

    if(!banInfo) return;

    message.channel.send({
      embed: {
        title: 'Ban info',
        description: `User: \`${banInfo.user.username + '#' + banInfo.user.discriminator}\`(${id})`,
        fields: [
          {
            name: "Reason",
            value: banInfo.reason
          }
        ]
      }
    })
  }
}