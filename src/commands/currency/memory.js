const {
  Message,
  Client,
  EmbedBuilder,
  Colors,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const Database = require('../../database/coins');
const cd = new Set();
let ingame = [];
module.exports = {
  name: 'memory',
  /**
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    let amount = args[0];
    if (!amount || !parseAmount(amount))
      return message.reply('Enter a valid bet.');

    amount = parseAmount(amount);
    const userId = message.author.id;
    const dbUser = await getUser(userId);
    if (dbUser.coins < amount) {
      return message.reply(`You don't have ${amount.toLocaleString()} coins.`);
    }
    if (amount > 5_000) {
      return message.reply('Maximum bet is 5,000!');
    }
    if (cd.has(userId)) {
      return message.reply('You can run this command once every minute.');
    }
    if (ingame.includes(userId))
      return message.reply('You already have a game running');
    addCd(userId);
    ingame.push(userId);
    await removeCoins(userId, amount);
    let emojis = [
      '😃',
      '🥹',
      '😂',
      '😇',
      '😌',
      '🙂',
      '🙃',
      '🤪',
      '😜',
      '🥺'
    ].sort(() => Math.random() - 0.5);

    const flow = emojis.slice(0, 5);
    const embed = new EmbedBuilder()
      .setTitle('Memory Game')
      .setColor(Colors.Yellow)
      .setFooter({
        text: `Win amount: ${(amount * 2.5).toLocaleString()} Time: 10 seconds.`
      })
      .setDescription(
        'The game will start in 2 seconds, click the emojis in correct order later on!'
      );
    const msg = await message.reply({
      embeds: [embed]
    });
    await sleep(2000);
    for (let i = 0; i < 5; i++) {
      embed.setDescription(`${flow[i]}`);
      await msg.edit({
        embeds: [embed]
      });
      await sleep(1000);
    }

    embed.setDescription('Click the emojis in correct order now!');
    const rows = [new ActionRowBuilder(), new ActionRowBuilder()];
    emojis = emojis.sort(() => Math.random() - 0.5);
    for (let i = 0; i < 10; i++) {
      if (i < 5) {
        rows[0].addComponents([
          new ButtonBuilder()
            .setCustomId(`0_${i}`)
            .setEmoji(`${emojis[i]}`)
            .setStyle(ButtonStyle.Secondary)
        ]);
      } else {
        rows[1].addComponents([
          new ButtonBuilder()
            .setCustomId(`1_${i}`)
            .setEmoji(`${emojis[i]}`)
            .setStyle(ButtonStyle.Secondary)
        ]);
      }
    }

    const collector = (
      await msg.edit({
        embeds: [embed],
        components: rows
      })
    ).createMessageComponentCollector({
      filter: async (m) => {
        if (m.user.id !== message.author.id) {
          await m.reply({
            ephemeral: true,
            content: 'This is NOT your game.'
          });
          return false;
        } else return true;
      },
      max: 5,
      time: 10_000
    });
    let count = 0;
    collector.on('collect', async (button) => {
      const emoji = button.component.emoji.name;
      const [row, index] = button.customId.split('_');
      if (flow[count] !== emoji) {
        rows[row].components[index > 4 ? index - 5 : index]
          .setDisabled()
          .setStyle(ButtonStyle.Danger);
        await button.deferUpdate();
        count = 0;
        collector.stop();
        cd.delete(userId);
        return;
      } else {
        rows[row].components[index > 4 ? index - 5 : index]
          .setDisabled()
          .setStyle(ButtonStyle.Success);
        await msg.edit({
          components: rows
        });
        await button.deferUpdate();
        count++;
      }
    });

    collector.on('end', async () => {
      if (count > 4) {
        await addCoins(userId, amount * 2.5);
        message.channel.send(
          `${message.author.toString()} you won <:token:1003272629286883450> **${(
            amount * 2.5
          ).toLocaleString()}** coins!!`
        );
      } else {
        message.channel.send(
          `${message.author.toString()} you lost <:token:1003272629286883450> **${amount.toLocaleString()}** coins!!`
        );
      }
      rows[0].components.forEach((c) => {
        c.setDisabled();
      });
      rows[1].components.forEach((c) => {
        c.setDisabled();
      });
      ingame = ingame.filter((a) => a !== message.author.id);
      return msg.edit({
        components: rows
      });
    });
  }
};
const addCd = async (userId) => {
  cd.add(userId);
  await sleep(60_000);
  cd.delete(userId);
};
const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
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
const breakArray = (array) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += 4) {
    chunks.push(array.slice(i, i + 4));
  }
  return chunks;
};
