const {
    Message,
    ButtonBuilder,
    ActionRowBuilder,
    EmbedBuilder,
    ButtonStyle,
} = require('discord.js')

// Models
const base = '../../database/models/'
const thirty = require(`${base}30k`)
const heist = require(base + 'heistm')
const grind = require(base + 'grindm')
const special = require(base + 'specialm')
const main = require('../../node_modules/discord-messages/models/messages')

const remind = require(base + 'remind')

// Models

module.exports = {
    name: 'removemydata',
    aliases: ['clearmydata'],
    description: 'Remove all your data from the database.',
    category: 'Other',
    /**
     *
     * @param {Message} message
     */
    async execute(message) {
        const userId = [remind, thirty]
        const userID = [heist, grind, special, main]

        const confirmation = await message.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle(':warning: Are you sure you want to do this?')
                    .setDescription(
                        'Doing this will __erase__ all your data from the database.\nThis includes:\n> __All__ your donations.\n> __All__ your reminders.\n\n**Are you sure you want to do this? __This change is irreversible!__**'
                    )
                    .setColor('Red')
                    .setFooter({
                        text: 'Use the buttons',
                    }),
            ],
            components: [
                new ActionRowBuilder().addComponents([
                    new ButtonBuilder()
                        .setLabel('REMOVE MY DATA')
                        .setCustomId('rmd-remove')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setLabel('GO BACK')
                        .setStyle(ButtonStyle.Success)
                        .setCustomId('rmd-no'),
                ]),
            ],
        })
        const collector = confirmation.createMessageComponentCollector({
            filter: (b) => {
                if (b.user.id !== message.author.id) {
                    return b.deferUpdate()
                } else return true
            },
            idle: 15 * 1000,
        })
        let edited = false
        collector.on('collect', async (button) => {
            const d = button.customId.includes('remove')
            if (d) {
                confirmation.components[0].components.forEach((c) => {
                    c.setDisabled()
                })
                await confirmation.edit({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription('Deleting all your data...')
                            .setColor('Yellow'),
                    ],
                    components: confirmation.components,
                })
                for (const db of userId) {
                    await db.deleteMany({
                        userId: message.author.id,
                    })
                }
                for (const dB of userID) {
                    await dB.deleteMany({
                        userID: message.author.id,
                    })
                }
                await message.client.functions.sleep(2500)
                edited = true
                collector.stop('okay')
                confirmation.edit({
                    embeds: [
                        new EmbedBuilder()
                            .setDescription(
                                ':ballot_box_with_check: All your data has been __erased__.'
                            )
                            .setColor('Green'),
                    ],
                })
            } else {
                confirmation.components[0].components.forEach((a) => {
                    a.setDisabled()
                })
                confirmation.edit({
                    components: confirmation.components,
                })
                edited = true
                collector.stop()
                return confirmation.reply('Well, I guess I keep your data.')
            }
        })

        collector.on('end', (res) => {
            if (!edited) {
                confirmation.components[0].components.forEach((a) => {
                    a.setDisabled()
                })
                confirmation.edit({
                    components: confirmation.components,
                })
                return confirmation.reply(
                    'Not erasing your data as I got left on read...'
                )
            }
        })
    },
}
