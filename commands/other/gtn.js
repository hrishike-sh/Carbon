const { Message } = require('discord.js')
module.exports = {
    name: 'gtn',
    usage: '<Max Number>',
    description: 'Guess the number (FH Only)',
    fhOnly: true,
    category: 'Utility',
    /**
     *
     * @param {Message} message
     * @param {*} args
     * @returns
     */
    execute(message, args) {
        if (
            message.author.id !== '450864876416401419' &&
            message.author.id !== '772524332382945292' &&
            message.author.id !== '598918643727990784' &&
            message.author.id !== '712316272213491824'
        )
            return
        let number = args[0]
        if (!number) number = 100
        let rawGuess = parseInt(number)
        let finalGuess = Math.floor(Math.random() * rawGuess + 1)
        const filter = (a) => parseInt(a.content) === parseInt(finalGuess)
        message.channel.send(
            `${message.author} I have dmmed you the right number!`
        )
        message.author.send(
            'The number to be guessed is **' + finalGuess + '**'
        )

        message.channel.send(
            'Now listening to messages, when someone guesses the right number, the channel will be locked!\n\nGood Luck!'
        )
        message.channel
            .awaitMessages({
                filter,
                max: 1,
            })
            .then((collected) => {
                try {
                    collected
                        .first()
                        .reply(`${collected.first().author} guessed it!`, {
                            embeds: [
                                {
                                    title: 'SOMEONE GUESSED IT!',
                                    description: `The correct number was **${finalGuess}**!`,
                                    timestamp: new Date(),
                                },
                            ],
                        })
                    message.channel.permissionOverwrites.edit(
                        message.guild.roles.everyone,
                        {
                            SEND_MESSAGES: false,
                        }
                    )
                } catch (e) {
                    console.log(e)
                }
            })
            .catch(console.error)
    },
}
