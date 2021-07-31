const {Command} = require('discord.js-commando');
const {MessageButton, MessageActionRow} = require('discord-buttons')
module.exports = class FightCommand extends Command {
  constructor(client){
    super(client, {
      name: 'connect4',
      aliases: ['c4'],
      group: "fights",
      memberName: 'connect4',
      description: 'Play connect4!',
    });
  }
    async run(message) {
      const opponent = message.mentions.users.first()
      if(!opponent) return message.reply('You must mention someone to play with!')

      let question = await message.channel.send(`${opponent} react to play with ${message.author}`)
      await question.react('✅')
      await question.react('❌')
      const filterR = (reaction, user) => ['❌', '✅'].includes(reaction.emoji.name) && user.id === opponent.id
      const questionR = await question.awaitReactions(filterR, { max: 1, time: 3e4})
      
      const reaction = questionR.first()
      try{
        if(reaction.emoji.name === '❌')  return message.channel.send('The fight has been cancelled')
        
        const b1 = new MessageButton()  
        .setStyle('blurple')
        .setID(btn1ID)
        .setEmoji('1️⃣')
        const b2 = new MessageButton()  
        .setStyle('blurple')
        .setID(btn2ID)
        .setEmoji('2️⃣')
        const b3 = new MessageButton()  
        .setStyle('blurple')
        .setID(btn3ID)
        .setEmoji('3️⃣')

        const buttonRow1 = new MessageActionRow()
        .addComponent(b1)
        .addComponent(b2)
        .addComponent(b3)

        const b4 = new MessageButton()  
        .setStyle('blurple')
        .setID(btn4ID)
        .setEmoji('4️⃣')
        const b5 = new MessageButton()  
        .setStyle('blurple')
        .setID(btn5ID)
        .setEmoji('5️⃣')
        const b6 = new MessageButton()  
        .setStyle('blurple')
        .setID(btn6ID)
        .setEmoji('6️⃣')

        const buttonRow2 = new MessageActionRow()
        .addComponent(b4)
        .addComponent(b5)
        .addComponent(b6)

        const b7 = new MessageButton()  
        .setStyle('blurple')
        .setID(btn7ID)
        .setEmoji('7️⃣')
        const cancelButton = new MessageButton()
        .setStyle('red')
        .setEmoji('❌')
        .setID(cancelButtonID)
        const disabledBut = new MessageButton()
        .setStyle('blurple')
        .setLabel('~')
        .setID('a')
        .setDisabled()

        const buttonRow3 = new MessageActionRow()
        .addComponent(disabledBut)
        .addComponent(b7)
        .addComponent(cancelButton)

        const player1 = message.author.id
        const player2 = opponent.id

        const mainMessage = await message.channel.send('', { components: [buttonRow1, buttonRow2, buttonRow3]})
        const butFilter = (button) => button.clicker.user.id === getRandom(player1, player2)
        const response = await mainMessage.awaitButtons(butFilter, { max: 1, time: 15e3})
        const resRea = response.first()
        try{
          if(resRea.button.id === cancelButtonID){
            return message.channel.send('This has been cancelled!')
          } 

        } catch {
          message.channel.send('You did not reply in time so I am going to end this!')
        }



      } catch(e) {
          message.channel.send(`${e}`)
      }
    }
}

const getRandomString = (length) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
  let results = ''

  for(i = 0; i < length; i++){
    results += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return results
}



/* AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA */

const btn1ID = `${getRandomString(5)}-${getRandomString(5)}-${getRandomString(5)}`;
const btn2ID = `${getRandomString(5)}-${getRandomString(5)}-${getRandomString(5)}`;
const btn3ID = `${getRandomString(5)}-${getRandomString(5)}-${getRandomString(5)}`;
const btn4ID = `${getRandomString(5)}-${getRandomString(5)}-${getRandomString(5)}`;
const btn5ID = `${getRandomString(5)}-${getRandomString(5)}-${getRandomString(5)}`;
const btn6ID = `${getRandomString(5)}-${getRandomString(5)}-${getRandomString(5)}`;
const btn7ID = `${getRandomString(5)}-${getRandomString(5)}-${getRandomString(5)}`;
const cancelButtonID = `${getRandomString(5)}-${getRandomString(5)}-${getRandomString(5)}`;

/* AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA */

const getRandom = (id1, id2) => {
  const randomArray = [id1, id2]

  return randomArray[Math.floor(Math.random() * randomArray.length)]
}

const buttonMap = {
  btn1ID: 'e'
}