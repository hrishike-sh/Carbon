import { Message, Client, User, EmbedBuilder } from 'discord.js';
import GrinderDonation from '../../database/models/GrinderDonation';

const cmrole = '1016728636365209631'; 

export default {
  name: 'grinderremove',
  aliases: ['gremove'],
  description: 'Removes a user from the grinder list',
  category: 'Moderation',
  permissions: ['ManageRoles'],

  async execute(message: Message, args: string[], client: Client) {
    if (!message.member?.roles.cache.has(cmrole)) {
      return message.reply({
        content: '❌ You must be a Community Manager to use this command!'
      });
    }

    const user =
      message.mentions.users.first() ||
      message.guild?.members.cache.get(args[0])?.user ||
      (await client.users.fetch(args[0]).catch(() => undefined));

    if (!user) {
      return message.reply({
        content: '❌ Please mention a user or provide a valid user ID!'
      });
    }

    try {
      const updatedGrinder = await GrinderDonation.findOneAndUpdate(
        { userID: user.id },
        {
          $set: {
            guildID: message.guild?.id,
            'dynamic.grinder': false,
            'dynamic.expires': Date.now() // Set to current time to immediately expire
          },
          $setOnInsert: {
            amount: 0,
            time: Date.now()
          }
        },
        { upsert: true, new: true }
      );

      return message.reply({
        content: `✅ Successfully removed ${user} from the grinder list!`,
        embeds: [
          new EmbedBuilder()
            .setDescription(`User's grinder status has been deactivated`)
            .setColor(Colors.Green)
            .setFooter({ text: `User ID: ${user.id}` })
            .setTimestamp()
        ]
      });
    } catch (error) {
      console.error('Error in grinderremove command:', error);
      return message.reply({
        content: '❌ Failed to remove user from grinder list!'
      });
    }
  }
};
