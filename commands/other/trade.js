
// why did i do this, should have paid attention in class

const {
  Command,
} = require('discord.js-commando');

const {
  MessageButton,
  MessageActionRow,
  MessageMenu,
  MessageMenuOption
} = require('discord-buttons');

const {
  MessageEmbed,
} = require('discord.js');

module.exports = class FightCommand extends Command {
  constructor(client){
    super(client, {
      name: 'trade',
      group: "other",
      memberName: 'trade',
      description: 'Trade with other users!',
    });
  }
   async run(message) {
     const trader1 = message.author
     const trader2 = message.mentions.users.first()
     if(!trader2) return message.channel.send("You must mention someone to trade with!")
     if(trader2.id === trader1.id) return message.channel.send("You can't trade with yourself")
     if(trader2.bot) return message.channel.send("You can't trade with bots.")

     // accept thing

     const embed1 = new MessageEmbed()
        .setTitle("Trade Offer")
        .setDescription(`${trader2}, ${trader1} wants to trade with you, would you like to trade with them?`)
        .setColor("RED")
        .setTimestamp()
     const aButton = new MessageButton()
        .setLabel("Accept")
        .setStyle("green")
        .setID('accept')
     const dButton = new MessageButton()
        .setLabel("Deny")
        .setStyle("red")
        .setID("deny")
     const row1 = new MessageActionRow()
        .addComponents([
          aButton,
          dButton
        ])
     const question = await message.channel.send(`${trader2}`, {
       embed: embed1,
       component: row1,
     })
     const questionButtons = await question.awaitButtons(b => b, { time: 6e4 })
     const res1 = questionButtons.first()
     try{
       
     } catch {
       message.channel.send("Since the oppnent didn't answer in time, the trade has been cancelled.")
     }
    }
}