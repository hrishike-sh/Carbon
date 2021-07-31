const {Command} = require('discord.js-commando');
const Anime_Images = require('anime-images-api')
const API = new Anime_Images()
module.exports = class RelaxPlsSTFU extends Command {
  constructor(client){
    super(client, {
      name: 'slap',
      aliases: ['stfurelax'],
      group: "other",
      memberName: 'slap',
      description: 'relax needs to stfu',
      throttling: {
        usages: 1,
        duration: 10
      }
    });
  }
    async run(message) {
      const prefix = 'fh '
      const args = message.content.slice(prefix.length).split(/ +/g)
      args.shift()
      const { image } = await API.sfw.slap()
      message.channel.send({ embed: {
        description: `**${message.author.username}** slaps **${message.mentions.users.size > 0 ? message.mentions.users.first().username : message.author.username}**`,
        image: {
          url: image
        }
      }})
    }
}

