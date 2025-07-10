const { Message, Client, Colors } = require('discord.js');

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
      '1016728636365209631',
      '858088054942203945',
      '825783847622934549'
    );
    const subcommand = args.shift();

    if (!subcommand)
      return message.reply(
        `Please mention a subcommand!\n\n\`fh raffle help\` for more info.`
      );
    const raffleLogsChannel = client.channels.cache.get('1389605274645561354');
    if (subcommand == 'help') {
      const embed = new EmbedBuilder()
        .setTitle('Raffle Command')
        .setColor(Colors.Yellow)
        .addFields([
          {
            name: 'fh raffle list',
            value: 'View the complete list of raffle participants',
            inline: true
          },
          {
            name: 'fh raffle view',
            value: 'View your raffle entries'
          }
        ]);

      if (isMod) {
        embed.addFields([
          {
            name: `fh raffle add <target> <entries>`,
            value: 'Add entries to a user',
            inline: true
          },
          {
            name: `fh raffle remove <target> <entries>`,
            value: 'Remove entries from a user',
            inline: true
          }
        ]);
      }

      await message.reply({
        embeds: [embed]
      });
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
      raffleLogsChannel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle('Entries added')
            .setDescription(
              `${
                message.author
              } added ${amount} entries to ${target.toString()} [here](${
                message.url
              })`
            )
            .setColor(Colors.Green)
            .setTimestamp()
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
      raffleLogsChannel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle('Removed entries')
            .setDescription(
              `${
                message.author
              } removed ${amount} entries from ${target.toString()} [here](${
                message.url
              })`
            )
            .setColor(Colors.Red)
            .setTimestamp()
        ]
      });
    } else if (subcommand == 'list') {
      const all = await Database.find({}).sort({ created: 1 });

      let start = 1;
      let end;

      const data = [];

      for (const user of all) {
        if (user.amount <= 0) continue;
        end = start + user.amount - 1;
        data.push(
          `\`${start}-${end}\`: <@${user.userId}> (${user.amount}) entries`
        );
        start = end + 1;
      }

      const chunked = chunkArray(data, 25);
      const messages = [];
      for (let i = 0; i < chunked.length; i += 2) {
        const embeds = [];
        for (const data of chunked.slice(i, i + 2)) {
          embeds.push(
            new EmbedBuilder()
              .setDescription(data.join('\n'))
              .setColor(Colors.Green)
          );
        }
        messages.push({ embeds });
      }

      for (const msg of messages) {
        await message.channel.send(msg);
      }
    } else if (subcommand == 'view') {
      const dbUser =
        (await Database.findOne({ userId: message.author.id })) || null;

      if (!dbUser) {
        await message.reply("You haven't joined this raffle!");
      }

      const allEntries = await Database.aggregate([
        {
          $group: {
            _id: null,
            totalAmount: {
              $sum: '$amount'
            }
          }
        },
        {
          $project: {
            totalAmount: 1
          }
        }
      ]);
      console.log(allEntries);
      const embed = new EmbedBuilder()
        .setAuthor({
          name: message.author.tag,
          iconURL: message.author.displayAvatarURL()
        })
        .setColor(Colors.Green)
        .setDescription(
          `**Your entries:** ${dbUser.amount}\n**Total entries:** ${allEntries[0].totalAmount}`
        )
        .setTimestamp();
      await message.reply({
        embeds: [embed]
      });
    }
  }
};

function chunkArray(array, chunkSize = 25) {
  const result = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
}
