const { sleep } = require('../../utils/helpers');

let banned = [];

module.exports = {
  name: 'ban',
  cooldown: 5,

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
      message.member.ban();
      message.reply(
        [
          `**${message.author.username}** was too weak to use the ban hammer and banned themselves :sob::sob::sob:`,
          `nobody likes you, you're banned **${message.author.username}**`
        ][Math.floor(Math.random() * 2)]
      );
      message.author.send({
        content: 'You were unlucky and banned yourself.'
      });
    } else if (chance < 0.1) {
      message.channel.send(
        `Someone has stealthily banned ${target.toString()}... :shushing_face:`
      );
      target.ban();
    } else if (chance > 0.1 && chance < 0.2) {
      message.reply('Your command failed :joy_cat:');
    } else if (chance < 0.4) {
      message.reply(
        [
          `${target.user.username} is too fast for you... you FAILED!`,
          `${target.user.username} escaped AND tea-bagged you... its time to end it.`,
          `${target.user.username} laughed your ban hammer off... you FAILED!`
        ][Math.floor(Math.random() * 3)]
      );
    } else {
      target.ban();
      message.reply(
        [
          `You have completely DEMOLISHED ${target.user.username}... they are BANNED.`,
          `${target.user.username} was outed for... being stupid! They are now BANNED.`,
          `WOP WOP WOP WOP WOP! ${target.user.username} was BANNED!`,
          `${target.user.username} were listening to drake... they are BANNED!`,
          `${target.user.username} is banned. You got the lamest response message.`
        ][Math.floor(Math.random() * 5)]
      );
      (await target.user.createDM()).send({
        content: `You were banned by ${message.author.toString()}.`
      });
    }
    message.delete();
  }
};
