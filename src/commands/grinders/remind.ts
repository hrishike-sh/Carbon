import { Message, Client, Colors, EmbedBuilder } from 'discord.js';
import GrinderDonation from '../../database/models/GrinderDonation';

const cmrole = '1016728636365209631'; 
const grinderchannel = '839800222677729310'; 
const ping = '738797748026867822'; 

export default {
  name: 'grinderremind',
  aliases: ['gremind'],
  description: 'Sends reminders to expired grinders',
  category: 'Moderation',
  permissions: ['ManageRoles'],

  async execute(message: Message, args: string[], client: Client) {
    // Permission check
    if (!message.member?.roles.cache.has(cmrole)) {
      return message.reply({
        content: '❌ You must be a Community Manager to use this command!'
      });
    }

    try {
      // Find expired grinders
      const expiredGrinders = await GrinderDonation.find({
        'dynamic.grinder': true,
        'dynamic.expires': { $lt: Date.now() }
      });

      if (expiredGrinders.length === 0) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setDescription('No expired grinders found.')
              .setColor(Colors.Green)
          ]
        });
      }

      const notificationChannel = await client.channels.fetch(
        grinderchannel
      );
      if (!notificationChannel?.isTextBased()) {
        throw new Error('Notification channel not found or not text-based');
      }

      let successCount = 0;
      const failedUsers: string[] = [];

      for (const grinder of expiredGrinders) {
        try {
          const user = await client.users.fetch(grinder.userID);
          const expiryTimestamp = Math.floor((grinder.dynamic.expires ?? 0) / 1000);

          const embed = new EmbedBuilder()
            .setTitle('Grinder Reminder ⚠')
            .setDescription(
              `Your grinder payment has been pending for **<t:${expiryTimestamp}:R>**!\n\n` +
                `Please ping <@${ping}> to make your payment!`
            )
            .setColor(Colors.Red)
            .setTimestamp();

          await notificationChannel.send({
            content: `<@${user.id}>`,
            embeds: [embed]
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to notify user ${grinder.userID}:`, error);
          failedUsers.push(grinder.userID);
        }
      }

      const summaryEmbed = new EmbedBuilder()
        .setTitle('Reminder Summary')
        .setDescription(
          `Successfully notified **${successCount}** grinders.\n` +
            (failedUsers.length > 0
              ? `Failed to notify: ${failedUsers
                  .map((id) => `\`${id}\``)
                  .join(', ')}`
              : 'All reminders sent successfully!')
        )
        .setColor(successCount > 0 ? Colors.Green : Colors.Red)
        .setTimestamp();

      await message.reply({ embeds: [summaryEmbed] });
    } catch (error) {
      console.error('Error in grinderremind command:', error);
      await message.reply({
        content: '❌ An error occurred while processing reminders.',
        embeds:
          error instanceof Error
            ? [
                new EmbedBuilder()
                  .setDescription(`\`\`\`${error.message}\`\`\``)
                  .setColor(Colors.Red)
              ]
            : undefined
      });
    }
  }
};
