const { SlashCommandBuilder } = require('@discordjs/builders')
const { CommandInteraction, Client, MessageEmbed } = require('discord.js')
const MainDonoModel = require('../node_modules/discord-messages/models/messages')
const GrindDonoModel = require('../database/models/grindm')
module.exports = {
    data: new SlashCommandBuilder()
        .setName('donation')
        .setDescription("Add a donation to a user's profile!")
        .addUserOption((option) => {
            return option
                .setName('user')
                .setDescription('The user.')
                .setRequired(true)
        })
        .addStringOption((option) => {
            return option
                .setName('type')
                .setDescription('Where do you want to add their donations to?')
                .addChoice('Main Donation', 'main_dono')
                .addChoice('Grinder Donation', 'grind_dono')
                .setRequired(true)
        })
        .addStringOption((option) => {
            return option
                .setName('action')
                .setDescription('Select what you want to do.')
                .setRequired(true)
                .addChoice('Add', 'dono_add')
                .addChoice('Remove', 'dono_remove')
                .setRequired(true)
        })
        .addStringOption((option) => {
            return option
                .setName('amount')
                .setDescription('Amount you want to add / remove.')
                .setRequired(true)
        }),
    /**
     * @param {CommandInteraction} interaction
     * @param {Client} client
     */
    async execute(interaction, client) {
        const data = {
            user: interaction.options.getUser('user'),
            type: interaction.options.getString('type'),
            action: interaction.options.getString('action'),
            amount: client.functions.parseAmount(
                interaction.options.getString('amount')
            ),
        }

        if (!data.amount)
            return interaction.reply(`Please provide valid amount.`)
        const roles = {
            maindono: [
                '824348974449819658',
                '825783847622934549',
                '858088054942203945',
                '824539655134773269',
            ],
        }
        let success = false
        const embed = new MessageEmbed()
        switch (data.type) {
            case 'main_dono':
                if (!interaction.member.roles.cache.hasAny(...roles.maindono)) {
                    return interaction.reply({
                        content: `You must have one of these roles to run the command:\n${roles.maindono
                            .map((v) => `<@&${v}>`)
                            .join(' ')}`,
                        ephemeral: true,
                    })
                }
                let dbUser = await MainDonoModel.findOne({
                    userID: data.user.id,
                })
                if (!dbUser) {
                    dbUser = new MainDonoModel({
                        userID: data.user.id,
                        guildID: interaction.guildId.at,
                        messages: 0,
                    })
                }

                if (data.action === 'dono_add') {
                    dbUser.messages += data.amount
                    interaction.reply({
                        embeds: [
                            embed
                                .setTitle('Donation added.')
                                .setDescription(
                                    `The donation was successfully added to ${data.user.toString()}'s profile!`
                                )
                                .addField(
                                    'Amount added',
                                    data.amount.toLocaleString(),
                                    true
                                )
                                .addField(
                                    'Responsible moderator',
                                    interaction.user.toString(),
                                    true
                                )
                                .setTimestamp()
                                .addField(
                                    "Added to user's Main Donation!",
                                    `**Total amount donated by this user:** ${dbUser.messages.toLocaleString()}`
                                )
                                .setColor('GREEN'),
                        ],
                    })
                    success = true
                } else if (data.action === 'dono_remove') {
                    dbUser.messages -= data.amount
                    interaction.reply({
                        embeds: [
                            embed
                                .setTitle('Donation removed.')
                                .setDescription(
                                    `The donation was successfully removed from ${data.user.toString()}'s profile!`
                                )
                                .addField(
                                    'Amount removed',
                                    data.amount.toLocaleString(),
                                    true
                                )
                                .addField(
                                    'Responsible moderator',
                                    interaction.user.toString(),
                                    true
                                )
                                .setTimestamp()
                                .addField(
                                    "Removed from user's Main Donation!",
                                    `**Total amount donated by this user:** ${dbUser.messages.toLocaleString()}`
                                )
                                .setColor('RED'),
                        ],
                    })
                    success = true
                } else return

                dbUser.save()
                break
            case 'grind_dono':
                if (!interaction.memberPermissions.has('ADMINISTRATOR')) {
                    return interaction.reply({
                        content: `You need to have \`ADMINISTRATOR\` to run this command`,
                        ephemeral: true,
                    })
                }

                const DBUser = await GrindDonoModel.findOne({
                    userID: data.user.id,
                })
                if (!DBUser)
                    return interaction.reply({
                        content: 'The user is not a grinder!',
                    })

                if (data.action === 'dono_add') {
                    DBUser.amount += data.amount
                    interaction.reply({
                        embeds: [
                            embed
                                .setTitle('Donation added.')
                                .setDescription(
                                    `The donation was successfully added to ${data.user.toString()}'s profile!`
                                )
                                .addField(
                                    'Amount added',
                                    data.amount.toLocaleString(),
                                    true
                                )
                                .addField(
                                    'Responsible moderator',
                                    interaction.user.toString(),
                                    true
                                )
                                .setTimestamp()
                                .addField(
                                    "Added to user's Main Donation!",
                                    `**Total amount donated by this user:** ${
                                        DBUser.messages.toLocaleString() ||
                                        'Error'
                                    }`
                                )
                                .setColor('GREEN'),
                        ],
                    })
                    success = true
                } else if (data.action === 'dono_remove') {
                    DBUser.amount -= data.amount
                    interaction.reply({
                        embeds: [
                            embed
                                .setTitle('Donation removed.')
                                .setDescription(
                                    `The donation was successfully removed from ${data.user.toString()}'s profile!`
                                )
                                .addField(
                                    'Amount removed',
                                    data.amount.toLocaleString() || 'Error',
                                    true
                                )
                                .addField(
                                    'Responsible moderator',
                                    interaction.user.toString(),
                                    true
                                )
                                .setTimestamp()
                                .addField(
                                    "Removed from user's Main Donation!",
                                    `**Total amount donated by this user:** ${DBUser.messages.toLocaleString()}`
                                )
                                .setColor('RED'),
                        ],
                    })
                    success = true
                } else return

                if (success)
                    client.channels.cache
                        .get('845043301937315870')
                        .send({ embeds: [embed] })
        }
    },
}
