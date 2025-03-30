import { Message, Client, EmbedBuilder, Colors, User, Guild } from 'discord.js';

const mod = '824539655134773269';
const cd = 3; // seconds

const formatTime = (time: Date, format?: string): string => {
  return `<t:${Math.floor(time.getTime() / 1000)}:${format || 'R'}>`;
};

export default {
  name: 'whois',
  aliases: ['wi'],
  description: 'Shows information about a user across mutual servers',
  category: 'Moderation',
  roles: [mod],
  cooldown: cd,

  async execute(message: Message, args: string[], client: Client) {
    if (!args[0]) {
      return message.reply('Please provide a user ID, mention, or username.');
    }

    try {
      const user =
        message.mentions.users.last() ||
        (await client.users.fetch(args[0]).catch(() => null)) ||
        client.users.cache.find(
          (u) => u.username === args[0] || u.tag === args[0]
        ) ||
        message.author;

      if (user.bot) {
        return message.reply('Bot information cannot be displayed.');
      }

      const loadingMsg = await message.reply({
        embeds: [
          {
            description: 'Fetching mutual servers...'
          }
        ]
      });

      const mutuals: string[] = [];
      const guilds = client.guilds.cache;

      for (const guild of guilds.values()) {
        try {
          const member = await guild.members.fetch(user.id).catch(() => null);
          if (member && guild.memberCount > 100) {
            mutuals.push(
              `**${guild.name}** (\`${
                guild.id
              }\`) *${guild.memberCount.toLocaleString()} members*`
            );
          }
        } catch (error) {
          continue;
        }
      }

      const embed = new EmbedBuilder()
        .setAuthor({
          name: `${user.tag} - ${user.id}`,
          iconURL: user.displayAvatarURL()
        })
        .setThumbnail(user.displayAvatarURL())
        .setDescription(
          `**Account Created:** ${formatTime(user.createdAt)} (${formatTime(
            user.createdAt,
            'D'
          )})\n\n` +
            `**Mutual Servers (${mutuals.length}):**\n${
              mutuals.join('\n') || 'None'
            }`
        )
        .setColor(Colors.Blurple)
        .setFooter({ text: `Requested by ${message.author.tag}` })
        .setTimestamp();

      return loadingMsg.edit({ embeds: [embed] });
    } catch (error) {
      console.error('Error in whois command:', error);
      return message.reply(
        'An error occurred while fetching user information.'
      );
    }
  }
};
