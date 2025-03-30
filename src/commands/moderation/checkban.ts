import {
  Message,
  Client,
  Colors,
  EmbedBuilder,
  Guild,
  TextChannel
} from 'discord.js';

const fh = '824294231447044197';
const mod = '848576301182877727';

export default {
  name: 'checkban',
  aliases: ['cb'],
  description: 'Checks if a user is banned in FightHub',
  category: 'Moderation',
  roles: [mod],

  async execute(message: Message, args: string[], client: Client) {
    const target = args[0]?.replace(/[^0-9]/g, '');
    if (!target) {
      return message.reply({
        content: '❌ Please provide a valid user ID or mention.'
      });
    }

    try {
      const fightHubGuild = client.guilds.cache.get(fh);
      if (!fightHubGuild) {
        return message.reply({
          content: '❌ Could not find FightHub guild.'
        });
      }

      const banInfo = await fightHubGuild.bans
        .fetch({ user: target })
        .catch(() => null);
      if (!banInfo) {
        return message.reply({
          content: `❌ User \`${target}\` is not banned in FightHub.`
        });
      }

      const embed = new EmbedBuilder()
        .setTitle('🔨 Ban Check')
        .setDescription(
          `**User:** <@${target}> (\`${target}\`)\n` +
            `**Reason:** ${banInfo.reason || 'No reason provided.'}`
        )
        .setColor(Colors.Red)
        .setFooter({ text: `Checked by ${message.author.tag}` })
        .setTimestamp();

      if (message.channel.isTextBased()) {
        return message.channel.send({ embeds: [embed] });
      } else {
        return message.reply({
          content: '❌ Cannot send messages in this channel type.'
        });
      }
    } catch (error) {
      console.error('Error in checkban command:', error);
      return message.reply({
        content: '❌ An error occurred while checking the ban status.'
      });
    }
  }
};
