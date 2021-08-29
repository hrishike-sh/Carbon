module.exports = {
  name: 'message',
  async execute(message, client){
  if(message.channel.id !== '826929140019232788') return;
  if(message.author.id !== '598918643727990784') return;

  // const description = message.embeds[0].description
  const id = parseInt(message.content) //parseInt(description.split('`')[1].split('id:')[1])
  
  client.guilds.cache.get('824294231447044197').members.fetch(id).then(member => {
    member.user.send({ embed: {
      title: "Thank you for voting for FightHub!",
      description: 'Your vote really helps out the server\nYou have got the \`VOTER\` role for 12 hours.\n\nYou can vote **[here](https://top.gg/servers/824294231447044197/vote)** again after 12 hours.',
      footer: {
        text: "Thank you for your support!"
      },
      color: 'GREEN',
      timestamp: new Date()
    }}).then(m => console.log(`${id} voted and they received the dm lol`))
  })

  }
}