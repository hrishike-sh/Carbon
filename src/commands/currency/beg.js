const { Message, Client } = require('discord.js');
const Database = require('../../database/coins');
const map = [
  'Hrish gave you {coins} coins for your left kidney!',
  'Begging? Try sex work instead! Hrish gave you {coins} coins and advice.',
  'Mirror gave you {coins} coins for admiring her beauty.',
  "Mirror's cat paid you {coins} coins to turn on the AC.",
  'Mirror gave you {coins} coins to watch KDramas with her!',
  'You caught spaghet touching grass, they paid you {coins} coins to shut the fuck up.',
  "You got paid {coins} coins to not tell anyone that Inter used you for an assessment because he can't type.",
  'You walked into steph and spaghet doing the devils tango, they paid you {coins} coins to get the hell out.',
  'You caught steph self reflecting in the bath tub, she paid you {coins} coins to leave her alone.',
  'You walked in on steph doing her makeup, she paid you {coins} coins to not tell anyone her beauty secrets.',
  'Akshay paid you {coins} coins to debug his code.',
  "Mirror's cat brought you {coins} coins, clearly preferring you over Mirror.",
  'You catch steph drinking at a bar instead of moderating. She paid you {coins} coins to let her get some damn rest',
  'Akshay gave you {coins} coins to not talk about his browser history.',
  '```py\n"You find glitch in a computer program, he gives you {coins} to run the code!"\n```',
  "You walked in on Akshay with his 'VR headset' on and he paid you {coins} coins to keep it quiet. ",
  "You found Akshay's stash of 'adult' magazines and he paid you {coins} coins to keep it a secret.",
  'Riyah gave you {coins} coins to stop donating for events.',
  "Sexcey gave you {coins} coins to not talk about the war crimes he's committed.",
  'Tee gave you {coins} coins to buy her food',
  'Sunshine gives you {coins} coins to stop the rain.',
  "You walked up to Gen taking his meds, here's {coins} coins to keep it a secret",
  'Apple gave you {coins} coins to spend on Valorant.',
  'Apple gave you {coins} coins to annoy Tee.',
  'Ali paid you {coins} coins to stop looking for his uncle, who has been missing since 2001.'
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
    if (message.guildId !== '824294231447044197') return;
    if (
      [
        '824313259976556544',
        '824313275750547456',
        '824313288967192597',
        '824313306633863278',
        '824318942511890452',
        '828201384910258186',
        '828201396334755860',
        '832893535509676093',
        '870240187198885888',
        '848939463404552222',
        '857629233152786442',
        '858295915428315136'
      ].includes(message.channel.id)
    ) {
      return message.react('❌');
    }
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
    const randomAmount = Math.ceil(Math.random() * 75) + 50;
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
