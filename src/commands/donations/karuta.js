const { Message, Client, Colors } = require('discord.js');
const DATABASE = require('../../database/tickets');
module.exports = {
  name: 'karuta',
  aliases: ['k', 'karu'],
  roles: [
    '824348974449819658',
    '824539655134773269',
    '858088054942203945',
    '825783847622934549'
  ],
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    const eg = `
        '**How to run this command:**\n\nfh k <target> <action> <amount>\n <target>: @ping or id\n <action>: add/remove/+/-\n <amount>: 100000/1m/2e6'
      `;
    const target = args.shift();
    if (!target) {
      return message.reply(eg);
    }

    // <target>
    const userId = target.replace(/[^0-9]/g, '');
    const user = await message.guild.members.fetch({
      user: userId
    });
    if (!user)
      return message.reply({
        content: `Could not find any user in this server with the ID '${userId}'!`
      });

    // <action>
    const action = args.shift();
    if (!action || !['add', 'remove', '+', '-'].includes(action.toLowerCase()))
      return message.reply(eg);

    let amount = args.shift();
    if (!amount || !parseAmount(amount)) return message.reply(eg);

    amount = parseAmount(amount);
    let dbUser = await DATABASE.findOne({
      userId: userId
    });
    if (!dbUser) {
      dbUser = new DATABASE({
        userId: userId
      });
    }
    if (['add', '+'].includes(action)) {
      dbUser.amount += amount;
      dbUser.save();

      return message.reply({
        embeds: [
          {
            title: 'Amount Added',
            color: Colors.Green,
            description: `**Amount Added:** :tickets: ${amount.toLocaleString()}\n**Total Donated by User:** :tickets: ${dbUser.amount.toLocaleString()}`,
            timestamp: new Date()
          }
        ]
      });
    } else {
      dbUser.amount -= amount;
      dbUser.save();

      return message.reply({
        embeds: [
          {
            title: 'Amount Removed',
            color: Colors.Red,
            description: `**Amount Removed:** :tickets: ${amount.toLocaleString()}\n**Total Donated by User:** :tickets: ${dbUser.amount.toLocaleString()}`,
            timestamp: new Date()
          }
        ]
      });
    }
  }
};

const parseAmount = (string) => {
  // Checks if first digit is valid number
  if (isNaN(string[0])) return null;

  // Return if number is like "5e4" etc.
  if (!isNaN(Number(string))) return Number(string);

  // Check for "m", "k" etc. and return value
  if (!string.endsWith('m') && !string.endsWith('k') && !string.endsWith('b'))
    return null;

  // Add values of m, k and b
  const val = string[string.length - 1];
  const rawString = string.replace(string[string.length - 1], '');
  const calculated = parseInt(rawString) * StringValues[val];

  // Invalid number
  if (isNaN(calculated)) return null;
  else return calculated;
};

const StringValues = {
  m: 1e6,
  k: 1e3,
  b: 1e9
};
