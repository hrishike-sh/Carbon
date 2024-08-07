const { Message, Client } = require('discord.js');
const Database = require('../../database/grinder_dono');
module.exports = {
  name: 'grinderremove',
  aliases: ['gremove'],
  /**
   * @param {Message} message Discord Message
   * @param {String[]} args Command Arguments
   * @param {Client} client Discord Client
   */
  async execute(message, args, client) {
    if (!message.member.roles.cache.has('1016728636365209631')) {
      return message.reply(
        'You must be a community manager to run this command!'
      );
    }
    const user =
      message.mentions.users?.first() ||
      message.guild.members.cache.get(args[0]) ||
      (await client.users.fetch(args[0]).catch(() => {}));
    if (!user)
      return message.reply(
        'Please mention a user to remove from the list of grinders!'
      );

    let db = await Database.findOne({
      userID: user.id
    });
    if (!db) {
      db = new Database({
        userID: user.id,
        guildID: message.guild.id,
        amount: 0,
        time: new Date().getTime(),
        dynamic: {
          grinder: false,
          expires: new Date().getTime() + 1000 * 60 * 60 * 24 * 3
        }
      });
    } else {
      db.dynamic = {
        expires: new Date().getTime(),
        grinder: false
      };
    }
    db.save();

    return message.reply({
      content: `Removed ${user} from the list of grinders!`
    });
  }
};
