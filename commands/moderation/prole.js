const { ButtonBuilder, ActionRowBuilder } = require('discord.js')

module.exports = {
    name: 'pingroles',
    aliases: ['proles', 'prole'],
    description: 'you dont need to know',
    fhOnly: true,

    async execute(message, args) {
        if (
            !message.member.roles.cache.some(
                (role) => role.id === '824348974449819658'
            ) &&
            !message.member.roles.cache.some(
                (role) => role.id === '824539655134773269'
            ) &&
            message.author.id !== '598918643727990784' // hrish you are dumb istg
        ) {
            message.channel.send('Only staff can perform this action.')
            return
        }

        const embed = {
            title: '**SERVER PINGS**',
            description:
                '<a:fh_announcement:824918261086945280> • <@&824916329848111114>\n' +
                '<a:fh_Nitroboostrgb:825302229853405184> • <@&832066859653398549>\n' +
                '<a:fh_giveaway:824918033889361941> • <@&824916330574118942>\n' +
                '<a:fh_freemoney:861295940785799168> • <@&837121985787592704>\n' +
                '<a:fh_pepeheist:839495312779640844> • <@&829283902136254497>\n' +
                '<a:fh_pepefight:861294809191677974> • <@&824916330905862175>\n' +
                '<a:fh_bugcatfight:855684995779264542> • <@&858088201451995137>',
        }

        const annBut = new ButtonBuilder()
            .setCustomId('ann_ping')
            .setEmoji('824918261086945280')
            .setStyle('SECONDARY')
        const nitBut = new ButtonBuilder()
            .setCustomId('nit_ping')
            .setEmoji('825302229853405184')
            .setStyle('SECONDARY')
        const gawBut = new ButtonBuilder()
            .setCustomId('gaw_ping')
            .setEmoji('824918033889361941')
            .setStyle('SECONDARY')
        const mgawBut = new ButtonBuilder()
            .setCustomId('mgaw_ping')
            .setEmoji('861295940785799168')
            .setStyle('SECONDARY')
        const hesBut = new ButtonBuilder()
            .setCustomId('hes_ping')
            .setEmoji('839495312779640844')
            .setStyle('SECONDARY')
        const touBut = new ButtonBuilder()
            .setCustomId('tou_ping')
            .setEmoji('861294809191677974')
            .setStyle('SECONDARY')
        const eveBut = new ButtonBuilder()
            .setCustomId('eve_ping')
            .setEmoji('855684995779264542')
            .setStyle('SECONDARY')

        const row1 = new ActionRowBuilder().addComponents([
            annBut,
            nitBut,
            gawBut,
            mgawBut,
        ])
        const row2 = new ActionRowBuilder().addComponents([
            hesBut,
            touBut,
            eveBut,
        ])

        message.channel.send({
            embeds: [embed],
            components: [row1, row2],
        })
    },
}
