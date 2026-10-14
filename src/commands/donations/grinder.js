const DATABASE = require('../../database/models/grinder_dono');
const config = require('../../config');
const { parseAmount } = require('../../utils/validators');
const { Theme } = require('../../utils/embeds');

module.exports = {
  name: 'grinder',
  aliases: ['g'],
  roles: [config.roles.staff.mod],

  async execute(message, args, client) {
    const eg = '**How to run this command:**\n\nfh g <target> <action> <amount>\n <target>: @ping or id\n <action>: add/remove/+/-\n <amount>: 100000/1m/2e6';
    const target = args.shift();
    if (!target) return message.reply(eg);

    const userId = /^(?:<@!?)?(\d{17,20})>?$/.exec(target)?.[1];
    if (!userId) return message.reply(eg);
    const user = await message.guild.members.fetch({ user: userId }).catch(() => null);
    if (!user)
      return message.reply({ content: `Could not find any user in this server with the ID '${userId}'!` });

    const action = args.shift()?.toLowerCase();
    if (!['add', 'remove', '+', '-'].includes(action))
      return message.reply(eg);

    const amount = parseAmount(args.shift());
    if (!Number.isSafeInteger(amount) || amount <= 0) return message.reply(eg);

    const dbUser = await DATABASE.findOneAndUpdate(
      { userID: userId, guildID: message.guild.id },
      { $inc: { amount: ['add', '+'].includes(action) ? amount : -amount } },
      { upsert: true, new: true }
    );
    if (['add', '+'].includes(action)) {
      return message.reply({
        embeds: [
          {
            title: 'Amount Added',
            color: Theme.success,
            description: `**Amount Added:** ⏣ ${amount.toLocaleString()}\n**Total Donated by User:** ${dbUser.amount.toLocaleString()}`,
            timestamp: new Date()
          }
        ]
      });
    } else {
      return message.reply({
        embeds: [
          {
            title: 'Amount Removed',
            color: Theme.error,
            description: `**Amount Removed:** ⏣ ${amount.toLocaleString()}\n**Total Donated by User:** ${dbUser.amount.toLocaleString()}`,
            timestamp: new Date()
          }
        ]
      });
    }
  }
};
