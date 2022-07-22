const { Formatters, MessageEmbed } = require('discord.js');

module.exports = {
    name: 'whois',
    aliases: ['wi'],
    description: 'Shows mutual guilds with the bot and information about them.',
    usage: '[user]',
    async execute(message, args, client) {
        try {
            const user = message.mentions.users.last() || (await client.users.fetch(args[0]).catch(() => null)) || client.users.cache.find((user) => user.username === args[0] || user.tag === args[0]) || message.author;
        
            const mutuals = new Array();
        
            const guilds = client.guilds.cache.values();
            
            for (const guild of guilds) {
                if (guild.members.cache.has(user.id) {
                    mutuals.push(`${Formatters.inlineCode(guild.id)} - ${Formatters.bold(guild.name)}`)
                } else {
                    continue;
                }
            }
        
            const embed = new MessageEmbed()
                .setAuthor({ name: `${user.tag} - ${user.id}`, iconURL: user.displayAvatarURL({ dynamic: true }) })
                .setThumbnail(user.displayAvatarURL({ dynamic: true }))
                .setDescription(`${Formatters.bold('Mutual Guilds')}\n${mutuals.join('\n')}`)
                .setColor('RANDOM');

            await message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error(error);
        }
    },
};
