const {Command} = require('discord.js-commando');
const Nuggies = require('nuggies')
module.exports = class StartCommand extends Command {
  constructor(client){
    super(client, {
      name: 'gstart',
      aliases: ['giveaway-start'],
      group: "giveaways",
      memberName: 'start',
      description: 'Start a giveaway',
    });
  }
    run(message) {

    if(!message.member.roles.cache.some(role => role.id === '825783847622934549') && message.author.id !== '598918643727990784'){
        return message.channel.send('You must have the "Giveaway Manager" role to perform this!')
    }
    const prefix = 'fh '
    const args = message.content.slice(prefix.length).split(/ +/g);
    // time
    const time = args[0]
    args.shift()
    const winners = parseInt(args[0])
    args.shift()
    const prize = args.join(' ')
    Nuggies.giveaways.create({
      message: message,
      prize: prize,
      host: message.author.id,
      winners: winners,
      endAfter: time,
      requirements: { enabled: false },
      channel: message.channel.id
    })
    

    }
}