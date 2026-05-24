const config = require('../../config');
const { CoinService } = require('../../database/services/coinService');
const cooldowns = require('../../command/cooldowns');
const antiBot = require('../../client/AntiBot');

const animalEmojis = [
  { name: 'Monkey', emoji: '🐒' },
  { name: 'Gorilla', emoji: '🦍' },
  { name: 'Orangutan', emoji: '🦧' },
  { name: 'Dog', emoji: '🐕' },
  { name: 'Dog Face', emoji: '🐶' },
  { name: 'Guide Dog', emoji: '🦮' },
  { name: 'Service Dog', emoji: '🐕‍🦺' },
  { name: 'Poodle', emoji: '🐩' },
  { name: 'Wolf', emoji: '🐺' },
  { name: 'Fox', emoji: '🦊' },
  { name: 'Raccoon', emoji: '🦝' },
  { name: 'Cat', emoji: '🐈' },
  { name: 'Cat Face', emoji: '🐱' },
  { name: 'Lion', emoji: '🦁' },
  { name: 'Tiger', emoji: '🐅' },
  { name: 'Tiger Face', emoji: '🐯' },
  { name: 'Leopard', emoji: '🐆' },
  { name: 'Horse', emoji: '🐎' },
  { name: 'Horse Face', emoji: '🐴' },
  { name: 'Unicorn', emoji: '🦄' },
  { name: 'Zebra', emoji: '🦓' },
  { name: 'Deer', emoji: '🦌' },
  { name: 'Bison', emoji: '🦬' },
  { name: 'Cow', emoji: '🐄' },
  { name: 'Ox', emoji: '🐂' },
  { name: 'Water Buffalo', emoji: '🐃' },
  { name: 'Cow Face', emoji: '🐮' },
  { name: 'Pig', emoji: '🐖' },
  { name: 'Pig Face', emoji: '🐷' },
  { name: 'Boar', emoji: '🐗' },
  { name: 'Pig Nose', emoji: '🐽' },
  { name: 'Ram', emoji: '🐏' },
  { name: 'Ewe', emoji: '🐑' },
  { name: 'Goat', emoji: '🐐' },
  { name: 'Camel', emoji: '🐪' },
  { name: 'Two-Hump Camel', emoji: '🐫' },
  { name: 'Llama', emoji: '🦙' },
  { name: 'Giraffe', emoji: '🦒' },
  { name: 'Elephant', emoji: '🐘' },
  { name: 'Mammoth', emoji: '🦣' },
  { name: 'Rhinoceros', emoji: '🦏' },
  { name: 'Hippopotamus', emoji: '🦛' },
  { name: 'Mouse', emoji: '🐁' },
  { name: 'Mouse Face', emoji: '🐭' },
  { name: 'Rat', emoji: '🐀' },
  { name: 'Hamster', emoji: '🐹' },
  { name: 'Rabbit', emoji: '🐇' },
  { name: 'Rabbit Face', emoji: '🐰' },
  { name: 'Chipmunk', emoji: '🐿️' },
  { name: 'Beaver', emoji: '🦫' },
  { name: 'Hedgehog', emoji: '🦔' },
  { name: 'Bat', emoji: '🦇' },
  { name: 'Bear', emoji: '🐻' },
  { name: 'Polar Bear', emoji: '🐻‍❄️' },
  { name: 'Koala', emoji: '🐨' },
  { name: 'Panda', emoji: '🐼' },
  { name: 'Sloth', emoji: '🦥' },
  { name: 'Otter', emoji: '🦦' },
  { name: 'Skunk', emoji: '🦨' },
  { name: 'Kangaroo', emoji: '🦘' },
  { name: 'Badger', emoji: '🦡' },
  { name: 'Paw Prints', emoji: '🐾' },
  { name: 'Turkey', emoji: '🦃' },
  { name: 'Chicken', emoji: '🐔' },
  { name: 'Rooster', emoji: '🐓' },
  { name: 'Hatching Chick', emoji: '🐣' },
  { name: 'Baby Chick', emoji: '🐤' },
  { name: 'Front-Facing Baby Chick', emoji: '🐥' },
  { name: 'Bird', emoji: '🐦' },
  { name: 'Penguin', emoji: '🐧' },
  { name: 'Dove', emoji: '🕊️' },
  { name: 'Eagle', emoji: '🦅' },
  { name: 'Duck', emoji: '🦆' },
  { name: 'Swan', emoji: '🦢' },
  { name: 'Owl', emoji: '🦉' },
  { name: 'Dodo', emoji: '🦤' },
  { name: 'Feather', emoji: '🪶' },
  { name: 'Flamingo', emoji: '🦩' },
  { name: 'Peacock', emoji: '🦚' },
  { name: 'Parrot', emoji: '🦜' },
  { name: 'Frog', emoji: '🐸' },
  { name: 'Crocodile', emoji: '🐊' },
  { name: 'Turtle', emoji: '🐢' },
  { name: 'Lizard', emoji: '🦎' },
  { name: 'Snake', emoji: '🐍' },
  { name: 'Dragon Face', emoji: '🐲' },
  { name: 'Dragon', emoji: '🐉' },
  { name: 'Sauropod', emoji: '🦕' },
  { name: 'T-Rex', emoji: '🦖' },
  { name: 'Spouting Whale', emoji: '🐳' },
  { name: 'Whale', emoji: '🐋' },
  { name: 'Dolphin', emoji: '🐬' },
  { name: 'Seal', emoji: '🦭' },
  { name: 'Fish', emoji: '🐟' },
  { name: 'Tropical Fish', emoji: '🐠' },
  { name: 'Blowfish', emoji: '🐡' },
  { name: 'Shark', emoji: '🦈' },
  { name: 'Octopus', emoji: '🐙' },
  { name: 'Spiral Shell', emoji: '🐚' },
  { name: 'Coral', emoji: '🪸' },
  { name: 'Jellyfish', emoji: '🪼' },
  { name: 'Snail', emoji: '🐌' },
  { name: 'Butterfly', emoji: '🦋' },
  { name: 'Bug', emoji: '🐛' },
  { name: 'Ant', emoji: '🐜' },
  { name: 'Honeybee', emoji: '🐝' },
  { name: 'Beetle', emoji: '🪲' },
  { name: 'Lady Beetle', emoji: '🐞' },
  { name: 'Cricket', emoji: '🦗' },
  { name: 'Cockroach', emoji: '🪳' },
  { name: 'Spider', emoji: '🕷️' },
  { name: 'Spider Web', emoji: '🕸️' },
  { name: 'Scorpion', emoji: '🦂' },
  { name: 'Mosquito', emoji: '🦟' },
  { name: 'Fly', emoji: '🪰' },
  { name: 'Worm', emoji: '🪱' },
  { name: 'Microbe', emoji: '🦠' }
];

module.exports = {
  name: 'hunt',
  cooldown: 10,

  async execute(message, args, client) {
    if (message.channel.parentId === config.ids.restrictedCategory) {
      return message.react('❌');
    }
    if (config.ids.restrictedCurrencyChannels.includes(message.channel.id)) {
      return message.react('❌');
    }
    if (!(await antiBot.check(message))) return;

    const userId = message.author.id;
    const random = Math.floor(Math.random() * 75) + 50;
    await CoinService.addCoins(userId, random);
    const randomAnimal = animalEmojis[Math.floor(Math.random() * animalEmojis.length)];
    message.reply({
      embeds: [
        {
          author: {
            icon_url: message.author.displayAvatarURL(),
            name: message.author.username
          },
          footer: { text: '👩‍🌾' },
          description: `You found ${randomAnimal.emoji} ${randomAnimal.name}! You sold it for <:token:${config.ids.emojis.token}> ${random.toLocaleString()} coins.`
        }
      ]
    });
  }
};
