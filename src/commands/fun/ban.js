const { Message, Client } = require('discord.js');
let banned = [];
module.exports = {
  name: 'ban',
  cooldown: 5,
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    if (message.guildId !== '1243193733223022823') return;

    const target = message.mentions?.members.first();
    if (!target) return message.reply('You have to mention someone!');
    if (target.roles.cache.hasAny('1243194015487365202', '1243193938685460500'))
      return message.reply('You cannot ban them idiot.');

    const chance = Math.random();
    if (banned.includes(message.author.id)) {
      return message.reply("You can't ban people right now.");
    }

    if (chance < 0.05) {
      // ban yourself

      message.member.ban();
      message.reply(
        [
          `**${message.author.username}** was too weak to use the ban hammer and banned themselves :sob::sob::sob:`,
          `nobody likes you, you're banned **${message.author.username}**`
        ][Math.floor(Math.random() * 2)]
      );
    } else if (chance < 0.1) {
      // delete message + ban

      message.delete();
      message.channel.send(
        `Someone has stealthily banned ${target.toString()}... :shushing_face:`
      );
      target.ban();
    } else if (chance > 0.1 && chance < 0.2) {
      // muted for a minute
      addBan(message.author.id);
      message.reply('You cannot ban anyone for the next minute loser.');
    } else if (chance < 0.4) {
      // command fails

      message.reply(
        [
          `${target.user.username} is too fast for you... you FAILED!`,
          `${target.user.username} escaped AND tea-bagged you... its time to end it.`,
          `${target.user.username} laughed your ban hammer off... you FAILED!`
        ][Math.floor(Math.random() * 3)]
      );
    } else {
      // ban
      target.ban();
      message.reply([
        `You have completely DEMOLISHED ${target.user.username}... they are BANNED.`,
        `${target.user.username} was outed for... being stupid! They are now BANNED.`,
        `WOP WOP WOP WOP WOP! ${target.user.username} was BANNED!`,
        `${target.user.username} were listening to drake... they are BANNED!`,
        `${target.user.username} is banned. You got the lamest response message.`
      ]);
    }
  }
};

const addBan = async (userId) => {
  banned.push(userId);
  await sleep(60000);
  banned = banned.filter((a) => a !== userId);
};
const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};
