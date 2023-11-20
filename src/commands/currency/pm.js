const DB = require('../../database/coins');
const { Message, Client, Colors } = require('discord.js');
module.exports = {
  name: 'presentmod',
  aliases: ['pm'],
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    const example = `Since your fatass don't know how to run the command here's an example:\n\nfh pm <@user/user_id> <+/-> <amount>`;

    if (!message.member.roles.cache.has('824539655134773269')) {
      return message.reply("You can't run this command you peasant");
    }
    const userId = args[0]?.replace(/[^0-9]/g, '') || null;
    if (!userId) {
      return message.reply(example);
    }
    args.shift();

    if (!args[0] || !['+', '-'].includes(args[0])) {
      return message.reply(example);
    }
    const what = args[0];
    args.shift();

    if (!args[0] || !parseAmount(args[0])) {
      return message.reply(example);
    }
    const amount = parseAmount(args[0]);

    //

    let DBUser = await DB.findOne({
      userId
    });
    if (!DBUser) {
      DBUser = new DB({
        userId,
        coins: 0
      });
    }
    if (what == '+') {
      DBUser.coins += amount;
    } else if (what == '-') {
      DBUser.coins -= amount;
    } else {
      return message.reply('what');
    }

    DBUser.save();
    const user = await client.users.fetch(userId);
    return message.reply({
      embeds: [
        {
          title: `<:fh_tickyes:1167089368775802940> Successfully ${
            what == '+' ? 'added' : 'removed'
          } ${amount.toLocaleString()} presents!`,
          author: {
            name: user.tag,
            iconURL: user.displayAvatarURL()
          },
          color: Colors.Green,
          description: `**New Total:** <:fh_present:1176190038023876739> ${DBUser.coins.toLocaleString()}`,
          timestamp: new Date()
        }
      ]
    });
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
