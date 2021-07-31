const {Command} = require('discord.js-commando');

module.exports = class FightCommand extends Command {
  constructor(client){
    super(client, {
      name: 'source',
      aliases: ['git', 'github', 'code'],
      group: "other",
      memberName: 'code',
      description: 'Check the bot\'s source code.',
    });
  }
    run(message) {
      message.channel.send({embed: {
          title: 'Source Code',
          description: '[Here](https://github.com/HrishikeshS123/FightHub/tree/main/FightHub) is the source code'
      }})
    }
}