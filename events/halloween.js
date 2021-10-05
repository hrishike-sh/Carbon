module.exports = {
    name: 'message',
    async execute(message, client){
       if(message.guild.id !== '824294231447044197') return;
       let cooldown = []
       const drop = Math.floor(Math.random() * 100) === 69 ? true : false
       
       if(!cooldown.includes(message.channel.id) && drop){
        console.log(`Can do a drop in ${message.channel.name}`)

          cooldown.push(message.channel.id)
          setTimeout(() => {
              cooldown = cooldown.filter(e => e !== message.channel.id)
          }, 2 * 1000)
       }
    }
}