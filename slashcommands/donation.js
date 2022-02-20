const { SlashCommandBuilder } = require('@discordjs/builders')
const { CommandInteraction, Client } = require('discord.js')

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
                .addChoice('Heist Donation', 'heist_dono')
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
    async execute(interaction, client){
       const data = {
           wanted = interaction.options.getString('action')
       }

       return interaction.reply(data.wanted.toString())
    }
}
