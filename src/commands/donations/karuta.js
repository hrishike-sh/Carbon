const DATABASE = require('../../database/models/tickets');
const config = require('../../config');
const { parseAmount } = require('../../utils/validators');
const { Theme } = require('../../utils/embeds');

module.exports = {
  name: 'karuta',
  aliases: ['k', 'karu'],
  roles: [config.roles.staff.admin, config.roles.staff.mod, config.roles.giveawayManager],

  async execute(message, args, client) {
    const eg = '**How to run this command:**\n\nfh k <target> <action> <amount>\n <target>: @ping or id\n <action>: add/remove/+/-\n <amount>: 100000/1m/2e6';
    const target = args.shift();
    if (!target) return message.reply(eg);

    const userId = target.replace(/[^0-9]/g, '');
    const user = await message.guild.members.fetch({ user: userId }).catch(() => null);
    if (!user)
      return message.reply({ content: `Could not find any user in this server with the ID '${userId}'!` });

    const action = args.shift();
    if (!action || !['add', 'remove', '+', '-'].includes(action.toLowerCase()))
      return message.reply(eg);

    let amount = args.shift();
    if (!amount || !parseAmount(amount)) return message.reply(eg);

    amount = parseAmount(amount);
    let dbUser = await DATABASE.findOne({ userId });
    if (!dbUser) {
      dbUser = new DATABASE({ userId });
    }
    if (['add', '+'].includes(action)) {
      dbUser.amount += amount;
      await dbUser.save();
      return message.reply({
        embeds: [
          {
            title: 'Amount Added',
            color: Theme.success,
            description: `**Amount Added:** :tickets: ${amount.toLocaleString()}\n**Total Donated by User:** :tickets: ${dbUser.amount.toLocaleString()}`,
            timestamp: new Date()
          }
        ]
      });
    } else {
      dbUser.amount -= amount;
      await dbUser.save();
      return message.reply({
        embeds: [
          {
            title: 'Amount Removed',
            color: Theme.error,
            description: `**Amount Removed:** :tickets: ${amount.toLocaleString()}\n**Total Donated by User:** :tickets: ${dbUser.amount.toLocaleString()}`,
            timestamp: new Date()
          }
        ]
      });
    }
  }
};
