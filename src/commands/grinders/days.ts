import { Message, Client, User } from 'discord.js';
import GrinderDonation from '../../database/models/GrinderDonation';

const cmrole = '1016728636365209631'; //cms
const MS_PER_DAY = 86400000; 

export default {
    name: 'grinderday',
    aliases: ['gday'],
    description: 'Extends a grinder\'s expiration time',
    category: 'Moderation',
    permissions: ['ManageRoles'],

    async execute(message: Message, args: string[], client: Client) {
        if (!message.member?.roles.cache.has(cmrole)) {
            return message.reply({ 
                content: '❌ You must be a Community Manager to use this command!' 
            });
        }

        const user = message.mentions.users.first() || 
                     message.guild?.members.cache.get(args[0])?.user;
        
        if (!user) {
            return message.reply({ 
                content: '❌ Please mention a user or provide a valid user ID!' 
            });
        }

        const days = args[1] ? parseInt(args[1]) : NaN;
        if (isNaN(days)) {
            return message.reply({ 
                content: '❌ Please specify a valid number of days to add!' 
            });
        }

        try {
            // Find grinder record
            const grinderData = await GrinderDonation.findOne({ 
                userID: user.id,
                'dynamic.grinder': true 
            });

            if (!grinderData) {
                return message.reply({ 
                    content: '❌ This user is not currently a grinder!' 
                });
            }

            const newExpiry = (grinderData.dynamic.expires ?? 0) + (days * MS_PER_DAY);
            grinderData.dynamic.expires = newExpiry;
            await grinderData.save();

            return message.reply({
                content: `✅ Added **${days} days** to **${user.username}'s** grinder status!\n` +
                         `New expiration: <t:${Math.floor(newExpiry / 1000)}:R>`
            });

        } catch (error) {
            console.error('Error in grinderday command:', error);
            return message.reply({ 
                content: '❌ An error occurred while updating grinder status.' 
            });
        }
    }
};