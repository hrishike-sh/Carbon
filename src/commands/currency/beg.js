const { Message, Client } = require('discord.js');

const map = [
  'Hrish gave you {coins} coins for your left kidney!',
  'Begging? Try sex work instead! Hrish gave you {coins} coins and an advice.',
  "Mirror paid you {coins} coins to not talk about her height. (4'3)",
  "Mirror's cat paid you {coins} coins to turn on the AC.",
  'Mirror gave you {coins} coins to watch KDramas with her!',
  'You caught spaghet touching grass, they paid you {coins} coins to stay quite.',
  "You got paid {coins} coins to not tell anyone that Inter used you for an assessment because he can't type.",
  'You walked into steph and spaghet doing the devils tango, they paid you {coins} coins to get the hell out.',
  'You caught steph self reflecting in the bath tub, she paid you {coins} coins to leave her alone.',
  'You walked in on steph doing her makeup, she paid you {coins} coins to not tell anyone her beauty secrets.',
  'Akshay paid you {coins} coins to debug his code.'
];
let cd = [];
module.exports = {
  name: 'beg',
  aliases: ['pleasegivemecoins'],
  description: 'beg u brokeass',
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    const userId = message.author.id;
    if (cd.includes(userId)) {
      return message.reply({
        embeds: [
          {
            author: {
              icon_url: message.author.displayAvatarURL(),
              name: message.author.username
            },
            footer: {
              text: 'Get a job'
            },
            description:
              "you can beg once every 5 seconds and you're still desperate :sob::sob::sob::sob::sob:"
          }
        ]
      });
    }
    addCd(userId);
    const randomAmount = Math.ceil(Math.random() * 30) + 10;
    addCoins(userId, randomAmount);

    return message.reply({
      embeds: [
        {
          author: {
            icon_url: message.author.displayAvatarURL(),
            name: message.author.username
          },
          footer: {
            text: 'Get a job'
          },
          description: map[Math.floor(Math.random() * map.length)].replace(
            '{coins}',
            randomAmount
          )
        }
      ]
    });
  }
};

const addCd = async (userId) => {
  cd.push(userId);
  await sleep(5000);
  cd = cd.filter((a) => a != userId);
};
const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

/**
 * DB Functions
 */

const addCoins = async (userId, amount) => {
  const user = await getUser(userId);
  user.coins += amount;
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
