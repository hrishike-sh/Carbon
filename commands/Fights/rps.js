// :prayge:
const {
    Command
} = require('discord.js-commando');
const {
    MessageButton,
    MessageActionRow
} = require('discord-buttons')
const {
    MessageEmbed
} = require('discord.js')
const w = require('weky')

module.exports = class RPSCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'rps',
            aliases: ['rockpaperscissors'],
            group: "fights",
            memberName: 'rps',
            description: 'RPS (:prayge:)',
        });
    }
    async run(message) {
        await w.RockPaperScissors({
            message: message,
            opponent: message.mentions.users.first(),
            embed: {
                title: 'Rock Paper Scissors',
                description: 'Press the button below to choose.',
                color: '#ffffff',
                timestamp: true,
            },
            buttons: {
                rock: 'Rock',
                paper: 'Paper',
                scissors: 'Scissors',
                accept: 'Accept',
                deny: 'Deny',
            },
            time: 60000,
            acceptMessage: '<@{{challenger}}> has challenged <@{{opponent}}> for a game of Rock Paper and Scissors!',
            winMessage: 'GG, <@{{winner}}> won!',
            drawMessage: 'This game is deadlock!',
            endMessage: "<@{{opponent}}> didn't answer in time. So, I dropped the game!",
            timeEndMessage: "Both of you didn't pick something in time. So, I dropped the game!",
            cancelMessage: '<@{{opponent}}> refused to have a game of Rock Paper and Scissors with you!',
            choseMessage: 'You picked {{emoji}}',
            noChangeMessage: 'You cannot change your selection!',
            othersMessage: 'Only {{author}} can use the buttons!',
            returnWinner: false,
        });

        //   const player1 = message.member
        //   const player2 = message.mentions.members.first()
        //   if(!player2) return message.reply('You must mention someone')

        //   const yesButID = `${getID(5)}-${getID(5)}-${getID(5)}`
        //   const noButID = `${getID(5)}-${getID(5)}-${getID(5)}`

        //   let yesBut = new MessageButton()
        //     .setLabel('Yes')
        //     .setStyle('green')
        //     .setID(yesButID)

        //  let noBut = new MessageButton()
        //     .setLabel('No')
        //     .setStyle('red')
        //     .setID(noButID)

        //   const row1 = new MessageActionRow()
        //     .addComponent(yesBut)
        //     .addComponent(noBut)

        //   const question = await message.channel.send(`React to play a game of RPS with ${message.author}`, row1)
        //   const filter = (button) => button.clicker.user.id === player2.id
        //   const response = await question.awaitButtons(filter, { max: 1, time: 3e4 })

        //   const finalRes = response.first()
        //   try{
        //     await finalRes.reply.defer()
        //     if(finalRes.id === noButID){
        //       return question.edit('This game has been cancelled!', row1)
        //     }

        //     /* main */

        //     /* IDs */
        //     const rockButID = `${getID(5)}-${getID(5)}-${getID(5)}`
        //     const paperButID = `${getID(5)}-${getID(5)}-${getID(5)}`
        //     const sciButID = `${getID(5)}-${getID(5)}-${getID(5)}`
        //     /* IDs */

        //     /* buttons */

        //     let rockButton = new MessageButton()
        //       .setLabel('ROCK')
        //       .setEmoji('🤜')
        //       .setStyle('blurple')
        //       .setID(rockButID)

        //     let paperBut = new MessageButton()
        //       .setLabel('PAPER')
        //       .setStyle('blurple')
        //       .setEmoji('✋')
        //       .setID(paperButID)

        //     let sciBut = new MessageButton()
        //       .setStyle('blurple')
        //       .setLabel('SCISSORS')
        //       .setEmoji('✌')
        //       .setID(sciButID)

        //     const mainRow = new MessageActionRow()
        //       .addComponent(rockButton)
        //       .addComponent(paperBut)
        //       .addComponent(sciBut)

        //     /* buttons */

        //     const mainMessage = await message.channel.send('What would you like to choose?', mainRow)
        //     const filterr = (button) => button.clicker.user.id === player1.id || button.clicker.user.id === player2.id
        //     const collector = await mainMessage.createButtonCollector(filterr, { time: 30000 })

        //     collector.on('collect', res => {
        //       let player1chose
        //       let player2chose
        //       let player1check
        //       let player2check

        //         if(res.clicker.user.id === player1.id){
        //           player1check = true
        //           if(res.id === rockButID){
        //             player1chose = '🤜'
        //             res.reply.send('You chose 🤜', true)

        //             if(player1check && player2check === true){

        //               mainMessage.edit('The game has ended', { component: null })

        //               let result;
        //               if(player1chose === player2chose) result = "It's a draw"
        //               else if(player1chose === '🤜' && player2chose === '🤚') result = `${player2} has won!`
        //               else if(player1chose === '🤚' && player2chose === '✌') result = `${player2} has won!`
        //               else if(player1chose === '✌' && player2chose === '🤜') result = `${player2} has won!`
        //               else result = `${player1} has won!`

        //               const winbed = new MessageEmbed()
        //                 .setTitle('ROCK PAPER SCISSORS')
        //                 .setURL('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
        //                 .addFields([
        //                   {
        //                     name: `${player1.username} chose`,
        //                     value: player1chose
        //                   },
        //                   {
        //                     name: `${player2.username} chose`,
        //                     value: player2chose
        //                   },
        //                   {
        //                     name: `Winner`,
        //                     value: result
        //                   }
        //                 ])
        //                 return message.channel.send({embed: winbed})
        //             } else {
        //               return;
        //             }
        //           } else if (res.id === paperButID){
        //             player1chose = '🤚'
        //             res.reply.send('You chose 🤚', true)

        //             if(player1check && player2check === true){

        //               mainMessage.edit('The game has ended', mainRow)

        //               let result
        //               if(player1chose === player2chose) result = "It's a draw"
        //               else if(player1chose === '🤜' && player2chose === '🤚') result = `${player2} has won!`
        //               else if(player1chose === '🤚' && player2chose === '✌') result = `${player2} has won!`
        //               else if(player1chose === '✌' && player2chose === '🤜') result = `${player2} has won!`
        //               else result = `${player1} has won!`

        //               const winbed = new MessageEmbed()
        //                 .setTitle('ROCK PAPER SCISSORS')
        //                 .setURL('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
        //                 .addFields([
        //                   {
        //                     name: `${player1.username} chose`,
        //                     value: player1chose
        //                   },
        //                   {
        //                     name: `${player2.username} chose`,
        //                     value: player2chose
        //                   },
        //                   {
        //                     name: `Winner`,
        //                     value: result
        //                   }
        //                 ])
        //                 return message.channel.send({embed: winbed})
        //           } else {
        //             return;
        //           }
        //         } else if (res.id === sciButID){
        //           player1chose = '✌'
        //             res.reply.send('You chose ✌', true)

        //             if(player1check && player2check === true){

        //               mainMessage.edit('The game has ended', { component: null })

        //               let result;
        //               if(player1chose === player2chose) result = "It's a draw"
        //               else if(player1chose === '🤜' && player2chose === '🤚') result = `${player2} has won!`
        //               else if(player1chose === '🤚' && player2chose === '✌') result = `${player2} has won!`
        //               else if(player1chose === '✌' && player2chose === '🤜') result = `${player2} has won!`
        //               else result = `${player1} has won!`

        //               const winbed = new MessageEmbed()
        //                 .setTitle('ROCK PAPER SCISSORS')
        //                 .setURL('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
        //                 .addFields([
        //                   {
        //                     name: `${player1.username} chose`,
        //                     value: player1chose
        //                   },
        //                   {
        //                     name: `${player2.username} chose`,
        //                     value: player2chose
        //                   },
        //                   {
        //                     name: `Winner`,
        //                     value: result
        //                   }
        //                 ])
        //                 return message.channel.send({embed: winbed})
        //           } else {
        //             return;
        //           }
        //         }
        //       } else if(res.clicker.user.id === player2.id){
        //         player2check = true

        //           if(res.id === rockButID){
        //             player2chose = '🤜'
        //             res.reply.send('You chose 🤜', true)

        //             if(player2check && player1check === true){

        //               mainMessage.edit('The game has ended', { component: null })

        //               let result;
        //               if(player1chose === player2chose) result = "It's a draw"
        //               else if(player1chose === '🤜' && player2chose === '🤚') result = `${player2} has won!`
        //               else if(player1chose === '🤚' && player2chose === '✌') result = `${player2} has won!`
        //               else if(player1chose === '✌' && player2chose === '🤜') result = `${player2} has won!`
        //               else result = `${player1} has won!`

        //               const winbed = new MessageEmbed()
        //                 .setTitle('ROCK PAPER SCISSORS')
        //                 .setURL('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
        //                 .addFields([
        //                   {
        //                     name: `${player1.username} chose`,
        //                     value: player1chose
        //                   },
        //                   {
        //                     name: `${player2.username} chose`,
        //                     value: player2chose
        //                   },
        //                   {
        //                     name: `Winner`,
        //                     value: result
        //                   }
        //                 ])
        //                 console.log('Game ended')
        //                 return message.channel.send(winbed)
        //             } else {
        //               return;
        //             }
        //           } else if (res.id === paperButID){
        //             player1chose = '🤚'
        //             res.reply.send('You chose 🤚', true)

        //             if(player2check && player1check === true){

        //               mainMessage.edit('The game has ended', { component: null })

        //               let result;
        //               if(player1chose === player2chose) result = "It's a draw"
        //               else if(player1chose === '🤜' && player2chose === '🤚') result = `${player2} has won!`
        //               else if(player1chose === '🤚' && player2chose === '✌') result = `${player2} has won!`
        //               else if(player1chose === '✌' && player2chose === '🤜') result = `${player2} has won!`
        //               else result = `${player1} has won!`

        //               const winbed = new MessageEmbed()
        //                 .setTitle('ROCK PAPER SCISSORS')
        //                 .setURL('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
        //                 .addFields([
        //                   {
        //                     name: `${player1.username} chose`,
        //                     value: player1chose
        //                   },
        //                   {
        //                     name: `${player2.username} chose`,
        //                     value: player2chose
        //                   },
        //                   {
        //                     name: `Winner`,
        //                     value: result
        //                   }
        //                 ])
        //                 return message.channel.send({embed: winbed})
        //           } else {
        //             return;
        //           }
        //         } else if (res.id === sciButID){
        //           player1chose = '✌'
        //             res.reply.send('You chose ✌', true)

        //             if(player2check && player1check === true){

        //               mainMessage.edit('The game has ended', { component: null })

        //               let result;
        //               if(player1chose === player2chose) result = "It's a draw"
        //               else if(player1chose === '🤜' && player2chose === '🤚') result = `${player2} has won!`
        //               else if(player1chose === '🤚' && player2chose === '✌') result = `${player2} has won!`
        //               else if(player1chose === '✌' && player2chose === '🤜') result = `${player2} has won!`
        //               else result = `${player1} has won!`

        //               const winbed = new MessageEmbed()
        //                 .setTitle('ROCK PAPER SCISSORS')
        //                 .setURL('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
        //                 .addFields([
        //                   {
        //                     name: `${player1.username} chose`,
        //                     value: player1chose
        //                   },
        //                   {
        //                     name: `${player2.username} chose`,
        //                     value: player2chose
        //                   },
        //                   {
        //                     name: `Winner`,
        //                     value: result
        //                   }
        //                 ])
        //                 return message.channel.send({embed: winbed})
        //           } else {
        //             return;
        //           }
        //         }
        //       }
        //     })

        //     collector.on('end', async collected => {
        //       if(collected.size < 2){
        //         await mainMessage.delete()
        //         return message.channel.send('The game has ended since one of you didnt respond in time.')
        //       }
        //     })
        //     /* main */
        //   } catch (e){
        //     console.log(e)
        //     return message.channel.send('Since the opponent didnt answer in time, the game has been cancelled')
        //   }
    }
}

const getID = (length) => {
    const randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
    let results = '';
    for (i = 0; i < length; i++) {
        results += randomChars.charAt(Math.floor(Math.random() * randomChars.length))
    }
    return results
}