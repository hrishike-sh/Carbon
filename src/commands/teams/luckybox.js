const {
  Message,
  Client,
  Colors,
  ActionRowBuilder,
  StringSelectMenuBuilder
} = require('discord.js');
const TeamsDB = require('../../database/teams');

let opening = [];

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

    if (Date.now() - Team.lastLb < 86400000) {
      const nextDb = 86400000 - (Date.now() - Team.lastLb);
      return message.reply(
        `You can open the lucky box again in <t:${(nextDb / 1000).toFixed(
          0
        )}:R> seconds.`
      );
    }

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

      const unboxMessage = await message.reply({
        embeds: [
          {
            description: `Opening your lucky box...`,
            color: Colors.Yellow
          }
        ]
      });
      await sleep(5000);
      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('team-select')
          .setPlaceholder('Select a team')
          .addOptions(
            otherTeams.map((name) => {
              return {
                label: name.name,
                value: name.id
              };
            })
          )
      );
      await unboxMessage.edit({
        embeds: [
          {
            title: 'Lucky Box 📦📦',
            description: `You opened your Lucky Box and got the ability to **remove 5 points from any other team!!**\n\nSelect the team below`,
            color: Colors.Green
          }
        ],
        components: [row]
      });

      const collector = unboxMessage.createMessageComponentCollector({
        filter: (i) => i.user.id === message.author.id,
        idle: 30_000,
        max: 1
      });

      collector.on('collect', async (button) => {
        const teamId = button.values[0];
        const team = await TeamsDB.findById(teamId);
        if (!team) return;

        team.points -= 5;
        await team.save();

        await button.reply({
          embeds: [
            {
              title: 'Lucky Box 📦📦',
              description: `You removed 5 points from the team ${team.name}`,
              color: Colors.Green
            }
          ]
        });

        await unboxMessage.edit({
          components: null
        });
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
    } else {
      // Nothing happens

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
            description: `You opened your lucky box and got nothing...`,
            color: Colors.Red
          }
        ]
      });
    }

    opening = opening.filter((id) => id !== Team.id);
  }
};

function sleep(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}
