const { Message } = require('discord.js');
const TeamsDB = require('../../database/teams');
const { Client } = require('discord.js');
const { Colors } = require('discord.js');

const opening = [];

module.exports = {
  name: 'luckybox',
  description: 'Open a lucky box.',
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   * @returns
   */
  execute: async (message, args, client) => {
    const userId = message.author.id;
    const Team = await TeamsDB.findOne({ users: userId });

    if (!Team) return message.reply('You are not in a team.');

    // if (Team.lastLb + 86400000 > Date.now()) {
    //   const nextDb = Team.lastLb + 86400000 - Date.now();
    //   return message.reply(
    //     `You can open the lucky box again in <t:${(nextDb / 1000).toFixed(
    //       0
    //     )}:R> seconds.`
    //   );
    // }

    if (opening.includes(Team.id)) {
      return message.reply('The lucky box is already opening.');
    }

    opening.push(Team.id);
    Team.lastLb = Date.now();
    const random = Math.floor(Math.random() * 100) + 1;

    if (random <= 35) {
      // 35%
      // +5 points

      Team.points += 5;
      await Team.save();

      const unboxMessage = await message.reply({
        embeds: [
          {
            description: `Opening your lucky box...`,
            color: Colors.Yellow
          }
        ]
      });
      await sleep(5000);

      await unboxMessage.edit({
        embeds: [
          {
            title: 'Lucky Box 📦📦',
            description: `You opened your lucky box and got 5 points!`,
            color: Colors.Green
          }
        ]
      });
    } else if (random <= 50) {
      // 15%
      // +10 points

      Team.points += 10;
      await Team.save();

      const unboxMessage = await message.reply({
        embeds: [
          {
            description: `Opening your lucky box...`,
            color: Colors.Yellow
          }
        ]
      });
      await sleep(5000);

      await unboxMessage.edit({
        embeds: [
          {
            title: 'Lucky Box 📦📦',
            description: `You opened your lucky box and got 10 points!`,
            color: Colors.Green
          }
        ]
      });
    } else if (random <= 65) {
      // 15%
      // -5 points another team

      const allTeams = await TeamsDB.find();
      const otherTeams = allTeams.filter(
        (team) => !team.users.includes(userId)
      );
      const randomTeam =
        otherTeams[Math.floor(Math.random() * otherTeams.length)];
      randomTeam.points -= 5;
      await randomTeam.save();

      const unboxMessage = await message.reply({
        embeds: [
          {
            description: `Opening your lucky box...`,
            color: Colors.Yellow
          }
        ]
      });
      await sleep(5000);

      await unboxMessage.edit({
        embeds: [
          {
            title: 'Lucky Box 📦📦',
            description: `You opened your lucky box removed 5 points from **${randomTeam.name}**!`,
            color: Colors.Green
          }
        ]
      });
    } else if (random <= 85) {
      // 20%
      // -5 points

      Team.points -= 5;
      await Team.save();

      const unboxMessage = await message.reply({
        embeds: [
          {
            description: `Opening your lucky box...`,
            color: Colors.Yellow
          }
        ]
      });
      await sleep(5000);

      await unboxMessage.edit({
        embeds: [
          {
            title: 'Lucky Box 📦📦',
            description: `You opened your lucky box and **lost** 5 points!`,
            color: Colors.Red
          }
        ]
      });
    } else if (random <= 90) {
      // nothing happens
      // +5 points & another lucky box

      Team.points += 5;
      Team.lastLb = Date.now() - 86400000;
      await Team.save();

      const unboxMessage = await message.reply({
        embeds: [
          {
            description: `Opening your lucky box...`,
            color: Colors.Yellow
          }
        ]
      });
      await sleep(5000);

      await unboxMessage.edit({
        embeds: [
          {
            title: 'Lucky Box 📦📦',
            description: `You opened your lucky box and got 5 points!\n\nYou were lucky and found ANOTHER Lucky Box!! Open it now with \`fh lootbox\``,
            color: Colors.Green
          }
        ]
      });
    }
  }
};

function sleep(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
