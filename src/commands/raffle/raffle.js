const { Message, Client } = require('discord.js');

const Database = require('../../database/raffle');
const { EmbedBuilder } = require('@discordjs/builders');

module.exports = {
  name: 'raffle',
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  execute: async (message, args, client) => {
    const isMod = message.member.roles.cache.hasAny(
      '824348974449819658',
      '1163857079300276254',
      '824539655134773269',
      '1016728636365209631'
    );

    const subcommand = args.shift();

    if (!subcommand)
      return message.reply(
        `Please mention a subcommand!\n\n\`fh raffle help\` for more info.`
      );

    if (subcommand == 'help') {
    } else if (subcommand == 'add') {
      if (!isMod)
        return message.reply(
          'You must be a moderator to run this sub-command!'
        );

      const target =
        message.mentions.members?.first() ||
        message.guild.members.cache.get(args[0]);

      if (!target.user) return message.reply('Please mention a valid user!');

      const amount = Number(args[1]);

      if (!amount) {
        return message.reply('Please specify an amount!');
      }

      if (isNaN(amount)) {
        return message.reply('Please specify a valid number!');
      }

      if (amount <= 0) {
        return message.reply('Please specify a number greater than 0!');
      }

      let p;

      try {
        p = await Database.findOneAndUpdate(
          {
            userId: target.user.id
          },
          {
            $inc: {
              amount
            }
          },
          {
            upsert: true,
            new: true
          }
        );
      } catch (error) {
        console.log(error);
        message.reply(`Tell hrish about this error:\n\n${error.message}`);
        return;
      }

      message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Added entries')
            .setDescription(
              `${target.toString()} now has a total of **${p.amount}** entries!`
            )
        ]
      });
    } else if (subcommand == 'remove') {
      if (!isMod)
        return message.reply(
          'You must be a moderator to run this sub-command!'
        );

      const target =
        message.mentions.members?.first() ||
        message.guild.members.cache.get(args[0]);

      if (!target.user) return message.reply('Please mention a valid user!');

      const amount = Number(args[1]);

      if (!amount) {
        return message.reply('Please specify an amount!');
      }

      if (isNaN(amount)) {
        return message.reply('Please specify a valid number!');
      }

      if (amount <= 0) {
        return message.reply('Please specify a number greater than 0!');
      }

      let p;

      try {
        p = await Database.findOneAndUpdate(
          {
            userId: target.user.id
          },
          {
            $inc: {
              amount: -amount
            }
          },
          {
            upsert: true,
            new: true
          }
        );
      } catch (error) {
        console.log(error);
        message.reply(`Tell hrish about this error:\n\n${error.message}`);
        return;
      }

      message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Removed entries')
            .setDescription(
              `${target.toString()} now has a total of **${p.amount}** entries!`
            )
        ]
      });
    } else if (subcommand == 'list') {
      if (!isMod)
        return message.reply(
          'You must be a moderator to run this sub-command!'
        );

      const all = await Database.find({}).sort({ created: -1 });

      let start = 1;
      let end;

      const data = [];

      for (const user of all) {
        end = start + user.amount - 1;

        data.push(
          `\`${start}-${end}\`: <@${user.userId}> (${user.amount}) entries`
        );
      }

      message.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle('Raffle List')
            .setDescription(data.join('\n'))
        ]
      });
    }
  }
};
