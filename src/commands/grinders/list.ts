import { Message, Client, EmbedBuilder } from 'discord.js';
import GrinderDonation from '../../database/models/GrinderDonation.ts';

const cmrole = '1016728636365209631';

export default {
  name: 'grinderslist',
  aliases: ['glist'],
  description: 'Lists all current grinders and their expiration times',
  category: 'Moderation',
  permissions: ['ManageRoles'],

  async execute(message: Message, args: string[], client: Client) {
    if (!message.member?.roles.cache.has(cmrole)) {
      return message.reply({
        content: '❌ You must be a Community Manager to use this command!'
      });
    }

    try {
      const activeGrinders = await GrinderDonation.find({
        'dynamic.grinder': true,
        'dynamic.expires': { $gt: Date.now() } // Only show active grinders
      }).sort({ 'dynamic.expires': 1 });

      if (activeGrinders.length === 0) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription('There are currently no active grinders.')
              .setColor('#FFA500')
          ]
        });
      }

      // Process each grinder
      const grinderList = await Promise.all(
        activeGrinders.map(async (grinder, index) => {
          const user = await client.users
            .fetch(grinder.userID)
            .catch(() => null);
          const displayName =
            user?.toString() || `Unknown (ID: ${grinder.userID})`;
          const expiryTime = Math.floor((grinder.dynamic.expires ?? 0) / 1000);

          return `**${(index + 1)
            .toString()
            .padStart(2, '0')}.** ${displayName} - <t:${expiryTime}:R>`;
        })
      );

      const chunks = this.chunkArray(grinderList, 15);

      for (const [index, chunk] of chunks.entries()) {
        const embed = new EmbedBuilder()
          .setTitle(
            index === 0
              ? 'Active Grinders List'
              : 'Active Grinders List (Continued)'
          )
          .setDescription(chunk.join('\n'))
          .setColor('#00FF00')
          .setFooter({ text: `Total: ${activeGrinders.length} grinders` })
          .setTimestamp();

        await message.channel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Error in grinderslist command:', error);
      return message.reply({
        content: '❌ An error occurred while fetching the grinders list.'
      });
    }
  },

  /**
   * Splits an array into chunks
   * @param array The array to chunk
   * @param size The size of each chunk
   * @returns Array of chunks
   */
  chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
};
