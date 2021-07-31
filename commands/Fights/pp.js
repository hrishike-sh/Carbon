// i never said this was not rigged 

const {Command} = require('discord.js-commando');

module.exports = class PPCommand extends Command {
  constructor(client){
    super(client, {
      name: 'pp',
      aliases: ['penis'],
      group: "fights",
      memberName: 'pp',
      description: 'pls pp but better :smirk:',
      args: [
        {
          key: 'mention',
          prompt: 'Please mention someone to fight with!',
          type: 'user'
        }
      ]
    });
  }
    async run(message, { mention }) {
      const player1 = message.author
      const palyer2 = mention.id

      const mainMessage = await message.channel.send('Generating pp...')
      await sleep(500)

      let player1size = getPP()
      let player2size = getPP()

      mainMessage.edit(`${player1}: **8${player1size}D**`)
      await sleep(500)
      mainMessage.edit(mainMessage.content + `\n\n${mention}: **8${player2size}D**`)
    }
}

const getPP = () => {
  let number = Math.floor(Math.random() * 10 + 1)
  let results = '';
  for(i = 0; i < number; i++){
    results += '='
  }
  return results
}

function sleep(ms){
  return new Promise(resolve => setTimeout(resolve, ms))
}