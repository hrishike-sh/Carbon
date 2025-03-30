import { Client, Partials, GatewayIntentBits } from 'discord.js';
import commandHandler from '../src/handlers/commandHandler';
import eventHandler from '../src/handlers/eventHandler.ts';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Configure client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.Reaction,
    Partials.User
  ]
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || '');

// Initialize counters
client.counts = {
  commandsRan: 0,
  messagesRead: 0
};

// Register handlers
commandHandler(client);
eventHandler(client);

// Start bot
client.login(process.env.DISCORD_TOKEN);
