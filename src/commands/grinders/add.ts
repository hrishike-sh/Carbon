import { Message, Client, User } from 'discord.js';
import GrinderDonation from '../../database/models/GrinderDonation.ts';

const REQUIRED_ROLE_ID = '1016728636365209631'; // Community Manager role
const GRINDER_DURATION_MS = 1000 * 60 * 60 * 24 * 3; // 3 days in milliseconds

export default {
  name: 'grinderadd',
  aliases: ['gadd'],
  description: 'Adds a user to the grinder list',
  category: 'Moderation',
  permissions: ['ManageRoles'],

  async execute(message: Message, args: string[], client: Client) {
    // Permission check
    if (!message.member?.roles.cache.has(REQUIRED_ROLE_ID)) {
      return message.reply({
        content: '❌ You must be a Community Manager to use this command!'
      });
    }

    // Get target user
    const user =
      message.mentions.users.first() ||
      message.guild?.members.cache.get(args[0])?.user;

    if (!user) {
      return message.reply({
        content: '❌ Please mention a user or provide a valid user ID!'
      });
    }

    try {
      // Find or create database entry
      let dbEntry = await GrinderDonation.findOne({ userID: user.id });

      const expiryTime = Date.now() + GRINDER_DURATION_MS;

      if (!dbEntry) {
        dbEntry = new GrinderDonation({
          userID: user.id,
          guildID: message.guild?.id,
          amount: 0,
          time: Date.now(),
          dynamic: {
            grinder: true,
            expires: expiryTime
          }
        });
      } else {
        dbEntry.dynamic = {
          grinder: true,
          expires: expiryTime
        };
      }

      // Save to database
      await dbEntry.save();

      return message.reply({
        content:
          `✅ Added ${user} to the grinder list!\n\n` +
          `**Note:** This user's status will expire <t:${Math.floor(
            expiryTime / 1000
          )}:R>`
      });
    } catch (error) {
      console.error('Error in grinderadd command:', error);
      return message.reply({
        content: '❌ An error occurred while processing this command.'
      });
    }
  }
};
