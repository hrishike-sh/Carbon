const { EmbedBuilder } = require('discord.js');
const db = require('../../database/models/highlight');
const config = require('../../config');
const { Theme } = require('../../utils/embeds');

module.exports = {
  name: 'highlight',
  aliases: ['hl'],

  async execute(message, args, client) {
    const allowedRoles = [
      config.roles.giveawayManager,
      config.roles.staff.mod,
      config.roles.staff.admin
    ];
    const userId = message.author.id;
    const sample = 'Incorrect usage! Examples below\n\n`fh hl add <hl>`, `fh hl remove <hl>`, `fh hl list`';

    if (!message.member.roles.cache.hasAny(...allowedRoles)) {
      return message.reply("You don't have the perks to use this command.");
    }

    const subcommand = args.shift();
    if (!subcommand) return message.reply(sample);

    const embed = new EmbedBuilder()
      .setTitle('Highlight')
      .setTimestamp()
      .setColor(Theme.success);

    if (subcommand === 'list') {
      const highlights = await db.findOne({ userId });
      if (!highlights?.highlights?.length) {
        embed.setDescription('You do not have any highlights! Add them using `fh hl add <item>`');
        return message.reply({ embeds: [embed] });
      }
      embed.setDescription(highlights.highlights.map((a, i) => `${i + 1}. ${a}`).join('\n'));
      return message.reply({ embeds: [embed] });
    } else if (subcommand === 'add') {
      const toAdd = args.shift();
      if (!toAdd) return message.reply(sample);
      if (toAdd.length < 3) {
        return message.reply('Your highlight must be atleast 3 characters long.');
      }

      let highlights = await db.findOne({ userId });
      if (highlights?.highlights.includes(toAdd))
        return message.reply('You already have this word in your highlights.');

      if (highlights) {
        highlights.highlights.push(toAdd);
        await highlights.save();
      } else {
        highlights = await db.create({ userId, highlights: [toAdd] });
      }

      if (client.state.highlights.has(toAdd)) {
        client.state.highlights.get(toAdd).push(userId);
      } else {
        client.state.highlights.set(toAdd, [userId]);
      }

      embed.setDescription(`Added \`${toAdd}\` to your highlights.`);
      return message.reply({ embeds: [embed] });
    } else if (subcommand === 'remove') {
      const toRemove = args.shift();
      if (!toRemove) return message.reply(sample);

      const highlights = await db.findOne({ userId });
      if (!highlights?.highlights.includes(toRemove)) {
        return message.reply("You dont have this word in your highlights. Check using `fh hl list`");
      }

      highlights.highlights = highlights.highlights.filter((a) => a !== toRemove);
      await highlights.save();

      if (client.state.highlights.has(toRemove)) {
        const users = client.state.highlights.get(toRemove);
        const index = users.indexOf(userId);
        if (index > -1) users.splice(index, 1);
        if (users.length === 0) client.state.highlights.delete(toRemove);
      }

      embed.setDescription(`Removed \`${toRemove}\` from your highlights.`);
      return message.reply({ embeds: [embed] });
    }
  }
};
