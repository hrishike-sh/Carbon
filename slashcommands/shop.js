const { SlashCommandBuilder } = require('@discordjs/builders')
const { CommandInteraction, Client, MessageEmbed } = require('discord.js')
const token = `<:token:1003272629286883450>`
const db = require('../database/models/token')
module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Browse the shop.'),
    /**
     *
     * @param {CommandInteraction} interaction
     * @param {Client} client
     */
    async execute(interaction, client) {
        const userId = interaction.user.id
        const bal1 = await db.findOne({ userId })

        const Shop = new MessageEmbed()
            .setTitle('Token Shop [BETA]')
            .setThumbnail(client.user.displayAvatarURL())
            .setDescription(`**Tokens:** ${bal1?.tokens || 0} ${token}`)
            .addField(
                '<:text_channel:1003342275037888522> Private Channel [Temporary]',
                `\` 💲 \` **Price** - 25,000 ${token}\n\` ⏰ \` **Time** - 7 Days\n\` 🔄 \` **Upkeep** - 500 ${token} / Day`
            )
            .addField(
                `<:role:1003345268751741099> Custom Role [Temporary]`,
                `\` 💲 \` **Price** - 50,000 ${token}\n\` ⏰ \` **Time** - 7 Days\n\` 🔄 \` **Upkeep** - 5000 ${token} / Week`
            )
            .addField(
                `🫂 Fellowship Invites [Permanent]`,
                `\` 💲 \` **Price** - 70,000 ${token}\n\` ⏰ \` **Time** - ♾`
            )
            .setFooter({
                text: 'Your perks may be revoked by an admin if the system is abused in any way.',
            })

        interaction.reply({
            embeds: [Shop],
        })
    },
}
