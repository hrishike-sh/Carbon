const Discord = require('discord.js');
require('@weky/inlinereply');
const { CommandoClient } = require('discord.js-commando');
const path = require('path');
const client = new CommandoClient({
	commandPrefix: 'fh ',
	owner: '598918643727990784'
});
require('discord-buttons')(client);
const { Database } = require('quick.replit');
const db = new Database(process.env.REPLIT_DB_URL);

const Nuggies = require('nuggies');
Nuggies.connect(process.env.mongopath);
const Messages = require('discord-messages');
Messages.setURL(process.env.mongopath);
const HeistDono = require('./functions/heist-dono');
HeistDono.setURL(process.env.mongopath);

const http = require('http');
http
	.createServer((_, res) => {
		res.end('Thats kinda sus bro');
	})
	.listen(8080);

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}`);
	const users = client.guilds.cache.get('824294231447044197').memberCount;
	client.user.setPresence({
		status: 'idle',
		activity: {
			name: `${users} fighters`,
			type: 'WATCHING'
		}
	});
});
client.on('error', console.error);

client.registry
	.registerGroups([
		['fights', 'FIGHT COMMANDS'],
		['other', 'UTILITY'],
		['util', 'DEFAULT COMMANDS'],
		['commands', 'OTHER'],
		['donations', 'SET OF COMMANDS FOR DONATIONS'],
		['giveaways', 'START GIVEAWAYS WITH BUTTONS']
	])
	.registerDefaultTypes()
	.registerDefaultCommands({
		eval: false,
		unknownCommand: false
	})
	.registerCommandsIn(path.join(__dirname, 'commands'));

client.on('clickButton', button => {
	Nuggies.buttonclick(client, button);
});

client.dispatcher.addInhibitor(msg => {
	if (
		msg.channel.id === '825672500385153035' ||
		msg.channel.id === '824313123728261150'
	) {
		return;
	}
});
client.login(process.env.token);