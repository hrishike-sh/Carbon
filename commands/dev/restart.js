module.exports = {
	name: 'restart',
	category: 'Developer',
    aliases: ['reboot', 'botisdyingplsreboot', 'EXITPROCESS'],
	 async execute (message, args, client) {
        if (!client.config.cmds.idiots.includes(message.author.id)) {
            return message.reply('You cannot use this.')
        }
		await message.channel.send('Restarting wait <a:fh_dead2:855683919394635786>');
		return process.exit();
	},
};