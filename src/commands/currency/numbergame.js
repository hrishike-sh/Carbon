const { Message, Client, EmbedBuilder, Colors } = require('discord.js');
const Database = require('../../database/coins');

module.exports = {
  name: 'numbergame',
  aliases: ['ng', 'num'],
  /**
   *
   * @param {Message} message Discord Message
   * @param {String[]} args Command Arguments
   * @param {Client} client Discord Client
   */
  async execute(message, args, client) {
    if (client.cd.has(message.author.id))
      return message.reply('Youre already running a command');

    const amount = parseAmount(args[0] || 'hrish');
    const dbuser = await getUser(message.author.id);
    if (!amount) {
      return message.reply('Invalid amount');
    }
    if (amount > dbuser.coins) {
      return message.reply('Not enough coins');
    }

    client.cd.add(message.author.id);
    await removeCoins(message.author.id, amount);
    const data = {
      def: amount,
      rand: Math.floor(Math.random() * 100) + 1,
      max_win: amount * 10
    };
    const infoEmbed = new EmbedBuilder()
      .setTitle('Guess the Number [1-100]')
      .setDescription(
        `**Current Win Amount: ${data.max_win.toLocaleString()}**\nAmount bet: ${data.def.toLocaleString()}`
      )
      .addFields([
        {
          inline: true,
          name: 'Rules',
          value: `- You start with __10x__ your bet amount (1,000 => 10,000)\n- Every wrong guess reduces your Win Amount by __50%__!\n- When you guess the correct number, you win/lose the __Current Win Amount__ above.\n- The bot tells you if the number is higher or lower than your guess.`
        }
      ])
      .setColor(Colors.Gold)
      .setFooter({
        text: 'Gambling is good for your health!'
      });

    message.reply({
      content: 'Guess the number between 1 and 100',
      embeds: [infoEmbed]
    });
    const collector = message.channel.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 60000
    });
    let win = false;
    collector.on('collect', async (msg) => {
      const guess = data.rand.toString();
      if (msg.message.content == guess) {
        await addCoins(message.author.id, data.max_win);
        msg.message.reply({
          content: `You guessed it! You won ${data.max_win.toLocaleString()}!`
        });
        win = true;
        collector.stop();
      } else {
        data.max_win = Math.floor(data.max_win / 2);
        const hl =
          Number(msg.message.content) > Number(data.rand) ? 'higher' : 'lower';
        infoEmbed.setDescription(
          `**Current Win Amount: ${data.max_win.toLocaleString()}**\nAmount bet: ${data.def.toLocaleString()}`
        );
        msg.message.reply({
          content: `The number is **${hl}** than **${data.rand}**. Try again!`,
          embeds: [infoEmbed]
        });
      }
    });
    collector.on('stop', async () => {
      if (!win) {
        client.cd.delete(message.author.id);
        return message.reply(
          'You ran out of time!\nYou lost ' +
            data.def.toLocaleString() +
            ' coins!'
        );
      }
    });
  }
};

/**
 * DB Functions
 */
const removeCoins = async (userId, amount) => {
  const user = await getUser(userId);
  user.coins -= Number(amount);
  user.save();
};
const addCoins = async (userId, amount) => {
  const user = await getUser(userId);
  user.coins += Number(amount);
  user.save();
};

const getUser = async (userId) => {
  let dbu = await Database.findOne({
    userId
  });
  if (!dbu) {
    dbu = new Database({
      userId,
      coins: 0
    });
  }
  return dbu;
};

/**
 * DB Functions
 */

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
const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};
