import { Client } from 'discord.js';

export default {
  name: 'ready',
  once: true,
  execute(client: Client) {
    console.log(`Logged in as ${client.user?.tag}!`);
    client.user?.setPresence({
      status: 'online',
      activities: [
        {
          name: 'support',
          type: 3
        }
      ]
    });
  }
};
