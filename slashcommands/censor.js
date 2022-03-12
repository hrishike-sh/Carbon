const { SlashCommandBuilder } = require('@discordjs/builders')
const { CommandInteraction, Client, MessageEmbed } = require('discord.js')
const DB = require('../database/models/settingsSchema')
module.exports = {
    data: new SlashCommandBuilder()
        .setName('censor')
        .setDescription('Configure the censors for your server.')
        .addSubcommand((cmd) => {
            return cmd
                .setName('add')
                .setDescription('Add a new censor.')
                .addStringOption((opt) => {
                    return opt
                        .setName('censor')
                        .setDescription('The trigger for the censor.')
                        .setRequired(true)
                })
                .addStringOption((opt) => {
                    return opt
                        .setName('censor-regex')
                        .setDescription(
                            'The trigger you want to add, but takes input as regex.'
                        )
                        .setRequired(false)
                })
        })
        .addSubcommand((cmd) => {
            return cmd
                .setName('remove')
                .setDescription('Remove a censor.')
                .addStringOption((opt) => {
                    return opt
                        .setName('id')
                        .setDescription(
                            'The ID of the censor. (ID can be found in /censor list)'
                        )
                        .setRequired(true)
                })
        })
        .addSubcommand((cmd) => {
            return cmd
                .setName('list')
                .setDescription('List of all the censors.')
        }),
    /**
     * @param {CommandInteraction} interaction
     * @param {Client} client
     */
    async execute(interaction, client) {
        const command = interaction.options.getSubcommand(true)
        let server = await DB.findOne({
            guildID: interaction.guild.id,
        })

        if (!server) {
            server = new DB({
                guildID: interaction.guild.id,
            })
        }
        if (!server.censors) {
            server.censors = {
                censors: [],
            }
        }

        if (command === 'add') {
            const data = {
                censor: interaction.options.getString('censor'),
                censor_regex: interaction.options.getString('censor-regex'),
            }

            if (data.censor_regex) {
                const sensor = {
                    id: (Math.random() + 1).toString(36).substring(7),
                    censor: data.censor_regex,
                    type: 'regex',
                }
                client.db.censors.push(sensor)
                server.censors.censors.push(sensor)
                server.save()

                return interaction.reply(
                    `A censor with RegExp \`${data.censor_regex}\` was added!`
                )
            } else {
                const sensor = {
                    id: (Math.random() + 1).toString(36).substring(7),
                    censor: data.censor,
                    type: 'string',
                }
                client.db.censors.push(sensor)
                server.censors.censors.push(sensor)
                server.save()

                return interaction.reply(
                    `A censor with string \`${data.censor}\` was added!`
                )
            }
        } else if (command === 'remove') {
            const id = interaction.options.getString('id')

            const sensor = server.censors.censors.filter((c) => c.id === id)[0]
            if (sensor) {
                server.censors.censors = server.censors.censors.filter(
                    (c) => c.id !== id
                )
                server.save()
                client.db.censors = client.db.censors.filter(
                    (censor) => censor.id !== id
                )
                return interaction.reply(
                    `Removed the censor with ID \`${id}\`!`
                )
            } else {
                return interaction.reply(
                    `I could not find any censor with the ID \`${id}\`!`
                )
            }
        } else if (command === 'list') {
            const sensors = server.censors.censors.map(
                (censor, index) =>
                    `${index + 1}. Name: \`${censor.censor}\`(${
                        censor.type
                    })\nID: ${censor.id}`
            )

            return interaction.reply({
                embeds: [
                    new MessageEmbed()
                        .setTitle('Censors')
                        .setColor('AQUA')
                        .setDescription(
                            sensors.join('\n\n') || 'No censors yet...'
                        )
                        .setTimestamp(),
                ],
            })
        }
    },
}
