const grinds = require('../../database/models/grindm')

module.exports = {
  name: 'grinders',
  aliases: ['grinder'],
  async execute(message, args, client){
    
    if(
      !message.member.roles.cache.get("824348974449819658")
    ){
      return message.channel.send("You cannot run this command.\nYou need the \`Administrator\` role to perform this.")
    }

    if(!args[0]) return message.channel.send("You did not specify valid arguments.")

    const firstArg = args[0]

    if(firstArg === 'add'){
      args.shift()
      const mentionId = message.mentions.members.size > 0 ? message.mentions.users.first().id : args[0]
      const user = await grinds.findOne( { userID: mentionId } )
      if(user){
        message.channel.send("The user is already a grinder.")
        return;
      }

      if(!client.users.cache.find(U => U.id === mentionId)){
        message.channel.send("Not a valid member.")
        return
      }

      const newUser = new grinds({
        userID: mentionId,
        guildID: message.guild.id,
        amount: 0,
        days: 0,
      })
      newUser.save()
      message.channel.send("New user has been created.")
    } else if (firstArg === 'remove') {
      args.shift()
      const mentionId = message.mentions.members.size > 0 ? message.mentions.users.first().id : args[0]
      const user = await grinds.findOne( { userID: mentionId } )
      if(!user){
        message.channel.send("The user is not a grinder.")
        return;
      }

      await grinds.deleteOne({ userID: mentionId })
      message.channel.send("Removed the user.")
    } else if (firstArg === 'days'){
      args.shift()
      if(!args[0]) return message.channel.send("You must specidy number of days.")
      const days = args[0]
      if(isNaN(days)) return message.channel.send("\"Days\" should be a valid number. Either negative or positive.")
      args.shift()
      if(!args[0]) return message.channel.send("You should either ping someone after the amount of days or you should give a valid id.")
      const mention = message.mentions.members.size > 0 ? message.mentions.members.first().id : args[0]
      const newUser = await grinds.findOne({ userID: mention })

      if(!newUser) return message.channel.send("The mentioned user is not a valid user.")

      newUser.days = newUser.days + parseInt(days)
      newUser.save()
      message.channel.send(`Added ${days} days to <@${mention}>\'s profile.`)
    }

  }
}