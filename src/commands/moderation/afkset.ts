import { Message, Client } from 'discord.js';
import AFK from '../../database/models/afk.ts';
import Settings from '../../database/models/settingsSchema.ts';

const REQUIRED_ROLES = ['824539655134773269', '824348974449819658'];
const COOLDOWN = 3; // seconds

const USAGE_GUIDE = `
**How to use this command:**

\`fh afkset clear <user_id/@user>\`
Removes AFK status from a user

\`fh afkset ignore\`
Toggles AFK ignore for this channel
`;

export default {
  name: 'afkset',
  cooldown: COOLDOWN,
  roles: REQUIRED_ROLES,
  description: 'Manages AFK settings and statuses',
  category: 'Moderation',
  permissions: ['ManageMessages'],

  async execute(message: Message, args: string[], client: Client) {
    const action = args.shift()?.toLowerCase();

    if (!action) {
      return message.reply({ content: USAGE_GUIDE });
    }

    try {
      switch (action) {
        case 'clear':
          return await this.handleClear(message, args, client);
        case 'ignore':
          return await this.handleIgnore(message, client);
        default:
          return message.reply({ content: USAGE_GUIDE });
      }
    } catch (error) {
      console.error('Error in afkset command:', error);
      return message.reply({
        content: '❌ An error occurred while processing this command.'
      });
    }
  },

  async handleClear(message: Message, args: string[], client: Client) {
    const userId = args.shift()?.replace(/[^0-9]/g, '');
    if (!userId) {
      return message.reply({ content: USAGE_GUIDE });
    }

    // Check if user is AFK
    const afkEntry = await AFK.findOne({ userId });
    if (!afkEntry) {
      return message.reply({
        content: `User <@${userId}> is not currently AFK!`
      });
    }

    // Remove AFK status
    await AFK.deleteOne({ userId });

    // Update client cache if exists
    if (client.db?.afks) {
      client.db.afks = client.db.afks.filter((id: string) => id !== userId);
    }

    return message.reply({
      content: `✅ Successfully removed AFK status from <@${userId}>`
    });
  },

  async handleIgnore(message: Message, client: Client) {
    // Permission check
    if (!message.member?.permissions.has('Administrator')) {
      return message.reply({
        content:
          '❌ You need Administrator permissions to use this sub-command.'
      });
    }

    const channelId = message.channel.id;
    let serverSettings = await Settings.findOne({
      guildID: message.guild?.id
    });

    // Create new settings if none exist
    if (!serverSettings) {
      serverSettings = new Settings({
        guildID: message.guild?.id,
        afkIgnore: []
      });
    }

    // Ensure afkIgnore array exists
    if (!serverSettings.afkIgnore) {
      serverSettings.afkIgnore = [];
    }

    // Toggle channel in ignore list
    const isIgnored = serverSettings.afkIgnore.includes(channelId);

    if (isIgnored) {
      // Remove from ignore list
      serverSettings.afkIgnore = serverSettings.afkIgnore.filter(
        (id) => id !== channelId
      );
      if (client.db?.afkIgnore) {
        client.db.afkIgnore = client.db.afkIgnore.filter(
          (id: string) => id !== channelId
        );
      }
    } else {
      // Add to ignore list
      serverSettings.afkIgnore.push(channelId);
      if (client.db?.afkIgnore) {
        client.db.afkIgnore.push(channelId);
      }
    }

    await serverSettings.save();

    return message.reply({
      content: `Channel ${message.channel.toString()} is now **${
        isIgnored ? 'no longer' : ''
      }** AFK ignored!`
    });
  }
};
