const {
  ActionRowBuilder,
  StringSelectMenuBuilder
} = require('discord.js');
const TeamsDB = require('../../database/models/teams');
const config = require('../../config');
const { sleep } = require('../../utils/helpers');
const { Theme } = require('../../utils/embeds');

let opening = [];

module.exports = {
  name: 'luckybox',
  description: 'Open a lucky box.',

  execute: async (message, args, client) => {
    if (message.channel.id !== config.ids.channels.event2025) return;
    const userId = message.author.id;
    const Team = await TeamsDB.findOne({ users: userId });

    if (!Team) return message.reply('You are not in a team.');

    if (Date.now() - Team.lastLb < 43200000) {
      const nextDb = 43200000 - (Date.now() - Team.lastLb);
      const nextOpenTimestamp = Math.floor((Date.now() + nextDb) / 1000);
      return message.reply(`You can open the lucky box again <t:${nextOpenTimestamp}:R>.`);
    }

    if (opening.includes(Team.id)) {
      return message.reply('The lucky box is already opening.');
    }

    opening.push(Team.id);
    Team.lastLb = Date.now();
    const random = Math.floor(Math.random() * 100) + 1;

    if (random <= 35) {
      Team.points += 5;
      await Team.save();
      const unboxMessage = await message.reply({
        embeds: [{ description: 'Opening your lucky box...', color: Theme.warning }]
      });
      await sleep(5000);
      await unboxMessage.edit({
        embeds: [{ title: 'Lucky Box 📦📦', description: 'You opened your lucky box and got 5 points!', color: Theme.success }]
      });
    } else if (random <= 50) {
      Team.points += 10;
      await Team.save();
      const unboxMessage = await message.reply({
        embeds: [{ description: 'Opening your lucky box...', color: Theme.warning }]
      });
      await sleep(5000);
      await unboxMessage.edit({
        embeds: [{ title: 'Lucky Box 📦📦', description: 'You opened your lucky box and got 10 points!', color: Theme.success }]
      });
    } else if (random <= 65) {
      const allTeams = await TeamsDB.find();
      const otherTeams = allTeams.filter((team) => !team.users.includes(userId));
      const unboxMessage = await message.reply({
        embeds: [{ description: 'Opening your lucky box...', color: Theme.warning }]
      });
      await sleep(5000);
      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('team-select')
          .setPlaceholder('Select a team')
          .addOptions(otherTeams.map((name) => ({ label: name.name, value: name.id })))
      );
      await unboxMessage.edit({
        embeds: [{ title: 'Lucky Box 📦📦', description: 'You opened your Lucky Box and got the ability to **remove 5 points from any other team!!**\n\nSelect the team below', color: Theme.success }],
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
          embeds: [{ title: 'Lucky Box 📦📦', description: `You removed 5 points from the team ${team.name}\n\nYou can open another lucky box right away!`, color: Theme.success }]
        });
        await unboxMessage.edit({ components: null });
      });
      collector.on('end', (collected, reason) => {
        if (reason === 'idle') {
          message.reply('You did not select a team in time.');
          unboxMessage.edit({ components: null });
        }
      });
    } else if (random <= 85) {
      Team.points -= 5;
      await Team.save();
      const unboxMessage = await message.reply({
        embeds: [{ description: 'Opening your lucky box...', color: Theme.warning }]
      });
      await sleep(5000);
      await unboxMessage.edit({
        embeds: [{ title: 'Lucky Box 📦📦', description: 'You opened your lucky box and **lost** 5 points!', color: Theme.error }]
      });
    } else if (random <= 90) {
      Team.points += 5;
      Team.lastLb = Date.now() - 43200000;
      await Team.save();
      const unboxMessage = await message.reply({
        embeds: [{ description: 'Opening your lucky box...', color: Theme.warning }]
      });
      await sleep(5000);
      await unboxMessage.edit({
        embeds: [{ title: 'Lucky Box 📦📦', description: 'You opened your lucky box and got 5 points!\n\nYou were lucky and found ANOTHER Lucky Box!! Open it now with `fh lootbox`', color: Theme.success }]
      });
    } else {
      const unboxMessage = await message.reply({
        embeds: [{ description: 'Opening your lucky box...', color: Theme.warning }]
      });
      await sleep(5000);
      await unboxMessage.edit({
        embeds: [{ title: 'Lucky Box 📦📦', description: 'You opened your lucky box and got nothing...', color: Theme.error }]
      });
    }

    opening = opening.filter((id) => id !== Team.id);
  }
};
