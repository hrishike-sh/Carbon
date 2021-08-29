module.exports = {
    name: 'gtn',
    usage: '<Max Number>',
    execute(message, args) {
        if (message.author.id !== '772524332382945292' && message.author.id !== '598918643727990784' && message.author.id !== '264186213848580096' && message.author.id !== '712316272213491824') return;
        const number = args[0]
        let rawGuess = parseInt(number)
        let finalGuess = Math.floor(Math.random() * rawGuess + 1)
        const filter = a => parseInt(a.content) === parseInt(finalGuess)
        message.channel.send(`${message.author} I have dmmed you the right number!`)
        message.author.send('The number to be guessed is **' + finalGuess + '**')

        message.channel.send('Now listening to messages, when someone guesses the right number, the channel will be locked!\n\nGood Luck!')
        message.channel.awaitMessages(filter, {
                max: 1,
                time: 60000000
            })
            .then(collected => {
                try {
                    message.channel.send(`${collected.first().author} guessed it!`, {
                        embed: {
                            title: 'SOMEONE GUESSED IT!',
                            description: `The correct number was **${finalGuess}**!`,
                            timestamp: new Date()
                        }
                    })
                    message.channel.updateOverwrite(message.channel.guild.roles.everyone, {
                        SEND_MESSAGES: false
                    })
                } catch (e) {
                    console.log(e)
                }
            })
            .catch(console.error)
    }
}