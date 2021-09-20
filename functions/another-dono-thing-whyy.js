const mongoose = require('mongoose')
const Grind = require('../database/models/specialm')
let mongoUrl;

class SpecialDono {
  
  /**
   *
   *
   * @static
   * @param {string} dbUrl - A valid mongo database URI.
   * @return {Promise} - The mongoose connection promise.
   * @memberof DiscordMessages
   */
  static async setURL(dbUrl) {
    if (!dbUrl) throw new TypeError("A database url was not provided.");
		if(mongoUrl) throw new TypeError("A database url was already configured.");
    mongoUrl = dbUrl;
    return mongoose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false
    });
  }

  static async add(userId, guildId, messages) {
    if (!userId) throw new TypeError("An user id was not provided.");
    if (!guildId) throw new TypeError("A guild id was not provided.");
    if (messages == 0 || !messages || isNaN(parseInt(messages))) throw new TypeError("An amount of messages was not provided/was invalid.");
		const user = await Grind.findOne({ userID: userId, guildID: guildId });

    if (!user) {
      const newUser = new Grind({
        userID: userId,
        guildID: guildId,
        amount: messages
    });

      await newUser.save().catch(e => console.log(`Failed to save new user.`));

      return messages;
    };

    user.amount += parseInt(messages, 10);

    await user.save().catch(e => console.log(`Failed to append messages: ${e}`) );

    return user.amount
  }

  static async remove(userId, guildId, messages) {
    if (!userId) throw new TypeError("An user id was not provided.");
    if (!guildId) throw new TypeError("A guild id was not provided.");
    if (messages == 0 || !messages || isNaN(parseInt(messages))) throw new TypeError("An amount of messages was not provided/was invalid.");

    const user = await Grind.findOne({ userID: userId, guildID: guildId });
    if (!user) return false;

    user.amount -= messages;

    user.save().catch(e => console.log(`Failed to subtract messages: ${e}`) );

    return user;
  }

   static async fetchLeaderboard(guildId, limit) {
    if (!guildId) throw new TypeError("A guild id was not provided.");
    if (!limit) throw new TypeError("A limit was not provided.");

    var users = await Grind.find({ guildID: guildId }).sort([['amount', 'descending']]).exec();

    return users.slice(0, limit);
  }

    static async computeLeaderboard(client, leaderboard, fetchUsers = false) {
    if (!client) throw new TypeError("A client was not provided.");
    if (!leaderboard) throw new TypeError("A leaderboard id was not provided.");

    if (leaderboard.length < 1) return [];

    const computedArray = [];

    if (fetchUsers) {
      for (const key of leaderboard) {
        const user = await client.users.fetch(key.userID) || { username: "Unknown", discriminator: "0000" };
        computedArray.push({
          guildID: key.guildID,
          userID: key.userID,
          amount: key.amount,
          position: (leaderboard.findIndex(i => i.guildID === key.guildID && i.userID === key.userID) + 1),
          username: user.username,
          discriminator: user.discriminator
        });
      }
    } else {
      leaderboard.map(key => computedArray.push({
        guildID: key.guildID,
        userID: key.userID,
        amount: key.amount,
        position: (leaderboard.findIndex(i => i.guildID === key.guildID && i.userID === key.userID) + 1),
        username: client.users.cache.get(key.userID) ? client.users.cache.get(key.userID).username : "Unknown",
        discriminator: client.users.cache.get(key.userID) ? client.users.cache.get(key.userID).discriminator : "0000"
      }));
    }

    return computedArray;
  }

  static async fetch(userId, guildId, fetchPosition = false) {
    if (!userId) throw new TypeError("An user id was not provided.");
    if (!guildId) throw new TypeError("A guild id was not provided.");
    const user = await Grind.findOne({
      userID: userId,
      guildID: guildId
    });
    if (!user) return false;
		let userobj = {}
    if (fetchPosition === true) {
      const leaderboard = await Grind.find({
        guildID: guildId
      }).sort([['amount', 'descending']]).exec();
      userobj.position = leaderboard.findIndex(i => i.userID === userId) + 1;
    }
		userobj.data = user
    return userobj;
  }
    
}

module.exports = SpecialDono