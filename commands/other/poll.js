const {Command} = require('discord.js-commando');
const {MessageMenuOption, MessageMenu, MessageButton} = require('discord-buttons')
const {MessageEmbed} = require('discord.js')
module.exports = class PollCommand extends Command {
  constructor(client){
    super(client, {
      name: 'poll',
      group: "other",
      memberName: 'poll',
      description: 'Make a poll',
    });
  }
   async run(message) {
     const prefix = 'fh poll'
     const args = message.content.slice(prefix.length).split('|');
     if(!args[2]){
         return message.channel.send('Not enough arguments found!\n\nUsage example: \`fh poll Dank Memer | Carl Bot | X User\`')
     } else if (args[3]){
         return message.channel.send('Max of **3** people can only be poll\'d atm!')
     }

     let option1user = args[0]
     let option2user = args[1]
     let option3user = args[2]
     let option1ID = `${getRandomString(5)}-${getRandomString(5)}-${getRandomString(5)}`
     let option2ID = `${getRandomString(5)}-${getRandomString(5)}-${getRandomString(5)}`
     let option3ID = `${getRandomString(5)}-${getRandomString(5)}-${getRandomString(5)}`
     let optionMenuID = `${getRandomString(5)}-${getRandomString(5)}-${getRandomString(5)}`
     let user1votes = 0;
     let user2votes = 0;
     let user3votes = 0;

     let option1 = new MessageMenuOption()
        .setLabel(`${option1user}`)
        .setEmoji('1️⃣')
        .setDescription(`Click here to vote for ${option1user}`)
        .setValue(option1ID)
     
     let option2 = new MessageMenuOption()  
        .setLabel(`${option2user}`)
        .setEmoji('2️⃣')
        .setDescription(`Click here to vote for ${option2user}`)
        .setValue(option2ID)

     let option3 = new MessageMenuOption()
        .setLabel(`${option3user}`)
        .setEmoji('3️⃣')
        .setDescription(`Click here to vote for ${option3user}`)
        .setValue(option3ID)

     let selectMenu = new MessageMenu()
        .setID(optionMenuID)
        .setPlaceholder('Click here to vote!')
        .setMaxValues(1)
        .setMinValues(1)
        .addOption(option1)
        .addOption(option2)
        .addOption(option3)

     const pollBed = new MessageEmbed()
      .setTitle('Poll')
      .setURL('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
      .setDescription('Vote using the menu, only works for the latest version of Discord!')
      .setTimestamp()
      .setFooter('FightHub')
      .addFields([
         {
            name: `${option1user}`,
            value: `Votes: **${user1votes}**`,
            inline: true
         },
         {
            name: `${option2user}`,
            value: `Votes: **${user2votes}**`,
            inline: true
         },
         {
            name: `${option3user}`,
            value: `Votes: **${user3votes}**`,
            inline: true
         }
      ])
      .setColor('GREEN')
      .setThumbnail('https://cdn.discordapp.com/avatars/855652438919872552/a3f12433ad44ff43bb9568222b4c4a4b.png?size=1024')
     const mainMessage = await message.channel.send(pollBed, selectMenu)
     let votedArray = []
     const collector = mainMessage.createMenuCollector((b) => b.id !== 'asdfasdfsdgja', { errors: ['time'] } )

     collector.on('collect', async button => {
        if(votedArray.includes(button.clicker.user.id)){
           return await button.reply.send('You have already voted! You can only vote once.', true)
        }
        const buttonValue = button.values[0]
        
        if(buttonValue === option1ID){
         user1votes++
         votedArray.push(button.clicker.user.id)
         button.reply.send('Your vote has been counted!', true)
      } else if(buttonValue === option2ID){
         user2votes++ 
         votedArray.push(button.clicker.user.id)
         button.reply.send('Your vote has been counted!', true)
      } else if(buttonValue === option3ID){
         user3votes++
         votedArray.push(button.clicker.user.id)
         button.reply.send('Your vote has been counted', true)
     }

     const pollBed2 = new MessageEmbed()
      .setTitle('Poll')
      .setURL('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
      .setDescription('Vote using the menu, only works for the latest version of Discord!')
      .setTimestamp()
      .setFooter('FightHub')
      .addFields([
         {
            name: `${option1user}`,
            value: `Votes: **${user1votes}**`,
            inline: true
         },
         {
            name: `${option2user}`,
            value: `Votes: **${user2votes}**`,
            inline: true
         },
         {
            name: `${option3user}`,
            value: `Votes: **${user3votes}**`,
            inline: true
         }
      ])
      .setColor('GREEN')
      .setThumbnail('https://cdn.discordapp.com/avatars/855652438919872552/a3f12433ad44ff43bb9568222b4c4a4b.png?size=1024')

      mainMessage.edit(pollBed2, selectMenu)
     })
     collector.on('end', e => {
       votedArray = []
     })
    }
}

const getRandomString = (length) => {
   const randomChar = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
   let results = ''

   for(i = 0; i < length; i++){
      results += randomChar.charAt(Math.floor(Math.random() * randomChar.length))
   }
   return results
}