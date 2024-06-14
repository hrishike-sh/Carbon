const { Message, Client } = require("discord.js");

module.exports = {
    name: "fight",
    /**
     * 
     * @param {Message} message 
     * @param {String[]} args 
     * @param {Client} client 
     */
    async execute(message,args,client){
        const target = message.mentions.members?.first() || null;
        if (!target) return message.reply('You have to mention someone!');
        if (target.id == message.author.id) return message.reply("You can't fight yourself!");
        
        const amount = parseAmount(args[1]);
        if (!amount) return message.reply('Invalid amount!');
    }
}const parseAmount = (string) => {
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
