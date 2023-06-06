const {
  Message,
  Client,
  ButtonStyle,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Colors
} = require('discord.js');

module.exports = {
  name: 'm',
  aliases: ['mod'],
  roles: ['824539655134773269'],
  cooldown: 3,
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    const subcommands = ['wi', 'ri'];

    if (!subcommands.includes(args[0])) {
      return message.reply(
        `Use a valid sub-command.\nSubcommands: ${subcommands.join(', ')}`
      );
    }

    const action = args[0].toLowerCase();
    if (action == 'wi') {
      args.shift();
      if (!args[0])
        return message.reply('Next time give me an id or ping the user.');

      try {
        const user =
          message.mentions.users.last() ||
          (await client.users.fetch(args[0]).catch(() => null)) ||
          client.users.cache.find(
            (user) => user.username === args[0] || user.tag === args[0]
          ) ||
          message.author;
        if (user.bot) return message.reply(`Only humans can be wi'd.`);
        const Mutuals = [];
        const mess = await message.reply({
          embeds: [
            {
              description: `Fetching guilds...`
            }
          ]
        });
        for await (const guild of client.guilds.cache.values()) {
          try {
            if (await guild.members.fetch(user.id)) {
              if (guild.memberCount <= 100) continue;
              Mutuals.push(
                `**${guild.name}** (\`${
                  guild.id
                }\`) *${guild.memberCount.toLocaleString()} members*`
              );
            }
          } catch (e) {
            continue;
          }
        }
        const embed = new EmbedBuilder()
          .setAuthor({
            name: `${user.tag} - ${user.id}`,
            iconURL: user.displayAvatarURL({ dynamic: true })
          })
          .setThumbnail(user.displayAvatarURL({ dynamic: true }))
          .setDescription(
            `Account was created ${client.functions.formatTime(
              user.createdAt
            )}(which is ${client.functions.formatTime(
              user.createdAt,
              'D'
            )})\n\n**__Mutual Servers__**\n${Mutuals.join('\n')}`
          )
          .setColor(Colors.Blurple);

        return mess.edit({
          embeds: [embed]
        });
      } catch (error) {
        console.error(error);
      }
    }
  }
};
