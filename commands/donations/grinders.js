const grinds = require('../../database/models/grindm')

module.exports = {
  name: 'grinders',
  aliases: ['grinder'],
  async execute(message, args){
    
    if(
      !message.member.roles.cache.get("824348974449819658")
    ){
      return message.channel.send("You cannot run this command.\nYou need the \`Administrator\` role to perform this.")
    }

    if(!args[0]) return message.channel.send("You did not specify valid arguments.")

    const firstArg = args[0]

    if(firstArg === 'add'){
      args.shift()
      const mentionId = message.mentions.mentions.size > 0 ? message.mentions.users.first().id : args[0]
      const user = await grinds.findOne( { userID: mentionId } )
      if(user){
        message.channel.send("The user is already a grinder.")
        return;
      }

      if(!message.guild.members.fetch(mentionId)){
        message.channel.send("Not a valid member.")
        return
      }

      const newUser = new grinds({
        userID: mentionId,
        guildID: message.guild.id,
        amount: 0,
        days: 0,
        lastUpdated: new Date()
      })
      message.channel.send("New user has been created.")
    } else if (firstArg === 'remove') {
      args.shift()
      const mentionId = message.mentions.mentions.size > 0 ? message.mentions.users.first().id : args[0]
      const user = await grinds.findOne( { userID: mentionId } )
      if(!user){
        message.channel.send("The user is not a grinder.")
        return;
      }

      await grinds.deleteOne({ userID: mentionId })
      message.channel.send("Removed the user.")
    }

  }
}