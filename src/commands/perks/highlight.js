const { Message, Client, EmbedBuilder, Colors } = require('discord.js');
const db = require('../../database/highlight');

module.exports = {
  name: 'highlight',
  aliases: ['hl'],
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    const allowedRoles = ['826002228828700718'];
    const userId = message.author.id;
    const sample = `Incorrect usage! Examples below\n\n\`fh hl add <hl>\`, \`fh hl remove <hl>\`, \`fh hl list\`, \`fh hl \``;

    if (!message.member.roles.cache.hasAny(...allowedRoles)) {
      return message.reply(`You don't have the perks to use this command.`);
    }

    const subcommand = args.shift();
    if (!subcommand) return message.reply(sample);

    const embed = new EmbedBuilder()
      .setTitle('Highlight')
      .setTimestamp()
      .setColor(Colors.Green);

    if (subcommand == 'list') {
      let highlights = await db.findOne({
        userId
      });

      if (!highlights || !highlights?.highlights?.length) {
        embed.setDescription(
          'You do not have any highlights! Add them using `fh hl add <item>`'
        );

        return message.reply({
          embeds: [embed]
        });
      }

      embed.setDescription(
        highlights.highlights.map((a, i) => `${i + 1}. ${a}`).join('\n')
      );

      return message.reply({
        embeds: [embed]
      });
    } else if (subcommand == 'add') {
      const toAdd = args.shift();
      if (!toAdd) return message.reply(sample);

      if (toAdd.length < 3) {
        return message.reply(
          'Your highlist must be atleast 3 characters long.'
        );
      }

      let highlights = await db.findOne({
        userId
      });

      if (highlights?.highlights.includes(toAdd))
        return message.reply(`You already have this word in your highlights.`);

      if (highlights) {
        highlights.highlights.push(toAdd);
        await highlights.save();
      } else {
        highlights = await db.create({ userId, highlights: [toAdd] });
      }

      embed.setDescription(`Added \`${toAdd}\` to your highlights.`);

      return message.reply({ embeds: [embed] });
    } else if (subcommand == 'remove') {
      const toRemove = args.shift();
      if (!toRemove) return message.reply(sample);

      let highlights = await db.findOne({
        userId
      });

      if (!highlights?.highlights.includes(toRemove)) {
        return message.reply(
          `You dont have this word in your highlights. Check your highlights using \`fh hl list\``
        );
      }

      highlights.highlights = highlights.highlights.filter(
        (a) => a != toRemove
      );

      await highlights.save();

      embed.setDescription(`Removed \`${toRemove}\` from your highlights.`);
      return message.reply({ embeds: [embed] });
    }
  }
};
