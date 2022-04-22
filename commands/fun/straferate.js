module.exports = {
    name: 'straferate',
    aliases: ['sr'],
    category: 'Fun',
    description:
        'STRAFE RATE STRAFE RATE STRAFE RATE STRAFE RATE STRAFE RATE STRAFE RATE STRAFE RATE  ',
    async execute(message) {
        const rate = Math.floor(Math.random() * 101)

        return message.channel.send({
            embeds: [
                {
                    color: 'RANDOM',
                    description: `${
                        message.mentions.users?.first()?.username || 'You'
                    } are ${rate}% Strafe <:fh_strafe:864780923944828938>`,
                },
            ],
        })
    },
}
