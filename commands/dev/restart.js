module.exports = {
	name: 'restart',
	category: 'Developer',
    aliases: ['reboot', 'botisdyingplsreboot', 'EXITPROCESS'],
	run: async (message, client, args) => {
        if (!client.config.cmds.trustedAccess.includes(message.author.id)) {
            return message.reply('You cannot use this.')
        }
		await message.channel.send('Restarting wait <a:fh_dead2:855683919394635786>');
		return process.exit();
	},
};