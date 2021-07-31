const {Command} = require('discord.js-commando');

module.exports = class FAQCommand extends Command {
  constructor(client){
    super(client, {
      name: 'faq',
      aliases: ['rigged'],
      group: "other",
      memberName: 'o5',
      description: 'Frequently asked questions that annoy the bot dev so he made a command about it too',
      args: [
        {
          key: 'whatques',
          prompt: 'Which FAQ do you want?',
          type: 'string',
          oneOf: ['rps']
        }
      ]
    });
  }
    run(message, {whatques}) {
      if(whatques.toLowerCase() === 'rps'){
        message.channel.send({embed: {
          title: 'RPS COMMAND',
          description: 'Frequently asked questions about the command RPS.',
          fields: [
            {
              name: '1. Can opponent see what I chose?',
              value: 'No, they can only see what you chose after the game ends'
            },
            {
              name: '2. I can select two things, this is RiGGeD!',
              value: 'It does not matter! Your last choice will ALWAYS be your current choice.'
            },
            {
              name: '3. Who is undefined?',
              value: 'Previously known bug, fixed!'
            }
          ],
          thumbnail: {
            url: 'https://cdn.discordapp.com/attachments/856111404322258959/856218192053141554/image0.jpg',
          },
          footer: {
            text: 'Not rigged, git gud'
          },
          timestamp: new Date(),
          image: {
            url: 'https://cdn.discordapp.com/attachments/842776802711961610/857844455624146954/unknown.png'
          }
        }})
      }
    }
}