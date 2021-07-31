const {TicTacToe} = require('weky')
const {Command} = require('discord.js-commando');

module.exports = class TTTCommand extends Command {
  constructor(client){
    super(client, {
      name: 'ttt',
      aliases: ['tictactoe'],
      group: "fights",
      memberName: 'f4',
      description: 'TicTacToe with buttons!',
      args: [
        {
          key: 'mention',
          prompt: 'Please mention someone!',
          type: 'member'
        }
      ]
    });
  }
    run(message, {mention}) {
    if(message.channel.id === '825672500385153035') return 
     const opponent = message.mentions.users.first();
    if (!opponent) return message.channel.send(`Please mention who you want to challenge at tictactoe.`);
    const {TicTacToe} = require('weky')
    const game = new TicTacToe({
    message: message,
    opponent: opponent,
    xColor: 'red',
    oColor: 'blurple',
    xEmoji: '❌',
    oEmoji: '0️⃣',
    })
    game.start()
    }
}