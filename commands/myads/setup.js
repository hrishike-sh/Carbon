const schema = require('../../database/models/ad')
const mongoose = require('mongoose')
let mongoUrl;
const {
  MessageButton,
  MessageActionRow
} = require('discord-buttons')
const {
  MessageEmbed
} = require('discord.js')
module.exports = {
  name: 'ad-setup',
  aliases: ['setup'],
  usage: '<Your Ad>',
  async execute(message, args){
    if (!mongoUrl) {
                    let dbURL = process.env.mongopath
                    mongoose.connect(dbURL, {
                        useNewUrlParser: true,
                        useUnifiedTopology: true,
                        useFindAndModify: false
                    })
                    mongoUrl = true;
                }
    // fh setup 1
    const userId = message.author.id
    const user = await schema.findOne({ userId })
    let ads = '';
    if(!user){
      const newUser = new schema({
        userId,
        ads
      })
      newUser.save()
      return message.channel.send("No old user was found, a new user was created.\nPlease re-run the command.")
    }
    
    if(!args[0]) return message.channel.send("You must specify your ad.")

    const ad = args.join(' ')
    if(ad.length > 500){
      return message.channel.send("Your ad cant be more than 500 characters.")
    }
    if(message.content.split('\n').length > 7){
      return message.channel.send("Your ad cant be more than 7 lines.")
    }

    ads = ad

    const finalUser = await schema.findOne({ userId })

    finalUser.ads = ads
    
    message.channel.send('Your ad has been setup, it will look like this.', {embed: {
      title: `${message.author.username}'s ad`,
      description: '> ' + ads,
      footer: {
        text: 'Setup your ad using \`fh ad-setup\`'
      },
      thumbnail: message.author.displayAvatarURL({ dynamic: false, format: 'png' }),
      color: "RANDOM"
    }})
    finalUser.save()
    


  }
}