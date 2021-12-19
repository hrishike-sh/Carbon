const { GuildMember, Client } = require('discord.js')
const serverSettings = require('../database/models/settingsSchema')

module.exports = {
    name: 'guildMemberAdd',
    once: false,
    /**
     *
     * @param {GuildMember} member
     * @param {Client} client
     */
    async execute(member, client) {
        const server = await serverSettings.findOne({
            guildID: member.guild.id,
        })
        if (!server) return
        if (!server.heistMode) return
        if (!server.heistMode.enabled) return

        server.heistMode.joined++
        server.save()
    },
}
