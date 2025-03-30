import { Client } from 'discord.js';

declare module 'discord.js' {
  interface Client {
    counts?: {
      commandsRan: number;
      messagesRead: number;
    };
    db?: {
      afks?: string[];
      afkIgnore?: string[];
    };
  }
}
