const {
    Message,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js')

module.exports = {
    name: 'guessthenumber',
    aliases: ['gtn'],
    usage: '<limit>',
    description: 'Use this command to start GuessTheNumber event!',
    /**
     * @param {Message} message
     * @param {String[]} args
     */
    async execute(message, args) {
        const modRoles = ['858088054942203945', '824348974449819658']
        if (!message.member.roles.cache.hasAny(...modRoles)) {
            return message.reply(
                'You do not have permission to use this command.'
            )
        }

        if (!args[0])
            return message.reply({
                content:
                    'Please provide a upper limit.\n\nThis example will start a gtn from 1-100: `fh gtn 100`',
            })

        if (isNaN(Number(args[0])))
            return message.reply('Provide a valid number.')

        const number = +args[0]
        const randomNumber = message.client.functions.getRandom(0, number)

        const msg = await message.channel.send({
            content: `${message.author.toString()} do you want to host a GTN(0-${number}) now?`,
            components: [
                new ActionRowBuilder().addComponents([
                    new ButtonBuilder()
                        .setLabel('Start')
                        .setStyle(ButtonStyle.Success)
                        .setCustomId('start-gtn'),
                    new ButtonBuilder()
                        .setLabel('No')
                        .setStyle(ButtonStyle.Danger)
                        .setCustomId('cancel-gtn'),
                ]),
            ],
        })

        const collector = msg.createMessageComponentCollector({
            filter: (b) => b.user.id === message.author.id,
            time: 30 * 1000,
        })

        collector.on('collect', async (button) => {
            if (button.customId !== 'start-gtn') {
                message.channel.send('The event has been cancelled!')
                return collector.stop('cancel')
            } else {
                collector.stop('start')
                button.reply({
                    content: `The number to be guessed is **${randomNumber}**!`,
                    ephemeral: true,
                })
                message.channel.send(
                    'The channel will be unlocked after 5 seconds and will be automatically locked after someone guesses the number.'
                )
                await message.client.functions.sleep(5000)
                message.channel.send('Good luck, channel is unlocked.')
                message.channel.permissionOverwrites.edit(
                    message.guild.roles.everyone,
                    {
                        SendMessages: true,
                    }
                )
                console.log(randomNumber)

                const col = message.channel.createMessageCollector({
                    filter: (m) => m.content === `${randomNumber}`,
                })

                col.on('collect', (m) => {
                    message.channel.permissionOverwrites.edit(
                        message.guild.roles.everyone,
                        {
                            SendMessages: false,
                        }
                    )
                    col.stop()
                    m.reply({
                        embeds: [
                            {
                                title: '🎉 We have our winner',
                                description: `The number to be guessed was **${randomNumber}** and ${m.author.toString()} guessed it!`,
                                timestamp: new Date(),
                            },
                        ],
                    })
                })
            }
        })

        collector.on('end', (reason) => {
            if (reason == 'cancel') {
                msg.components[0].components
                    .find((b) => b.customId !== 'cancel-gtn')
                    .setStyle(ButtonStyle.Secondary)
                msg.components[0].components.forEach((d) => {
                    d.setDisabled()
                })

                msg.edit({
                    components: [...msg.components],
                })
            } else if (reason === 'start') {
                msg.components[0].components
                    .find((b) => b.customId === 'cancel-gtn')
                    .setStyle(ButtonStyle.Secondary)
                msg.components[0].components.forEach((d) => {
                    d.setDisabled()
                })

                msg.edit({
                    components: [...msg.components],
                })
            } else {
                msg.components[0].components.forEach((d) => {
                    ButtonBuilder.from(d).setDisabled()
                })

                msg.edit({
                    components: [...msg.components],
                })
            }
        })
    },
}
