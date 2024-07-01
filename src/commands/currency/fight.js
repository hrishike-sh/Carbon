const {
  Message,
  Client,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Colors
} = require('discord.js');
const Database = require('../../database/coins');
module.exports = {
  name: 'fight',
  /**
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    if (!message.guild || message.guild.id != '824294231447044197') return;
    const target = message.mentions.members.first();
    if (!target) return message.reply('You have to mention someone!');
    if (target.user.id == message.author.id)
      return message.reply("You can't fight yourself!");
    args.shift();
    const amount = parseAmount(args[0]);
    if (!amount) return message.reply('Mention the bet!');
    const db = {
      user: await getUser(message.author.id),
      target: await getUser(target.id)
    };
    if (amount > db.user.coins)
      return message.reply('You dont have that many coins!');
    if (amount > db.target.coins)
      return message.reply(`${target.toString()} does not have enough coins!`);

    if (client.cd.has(message.author.id) || client.cd.has(target.id)) {
      return message.reply(
        'Either you or your opponent is already in a game..'
      );
    }
    client.cd.add(message.author.id);
    client.cd.add(target.id);

    const row = new ActionRowBuilder().addComponents([
      new ButtonBuilder()
        .setStyle(ButtonStyle.Success)
        .setCustomId('confirm')
        .setLabel('Confirm'),
      new ButtonBuilder()
        .setStyle(ButtonStyle.Danger)
        .setCustomId('cancel')
        .setLabel('Cancel')
    ]);

    const confirmationMessage = await message.channel.send({
      content: `${target.toString()} do you want to fight ${message.author.toString()} for ${amount.toLocaleString()} coins?`,
      components: [row]
    });
    const confirmationCollector =
      confirmationMessage.createMessageComponentCollector({
        filter: (m) => m.user.id === target.id,
        idle: 25_000
      });

    confirmationCollector.on('collect', async (m) => {
      if (m.customId === 'confirm') {
        const temp = {
          u: await getUser(message.author.id),
          t: await getUser(target.id)
        };
        if (amount > temp.u.coins) {
          confirmationCollector.stop();
          client.cd.delete(message.author.id);
          client.cd.delete(target.id);
          return message.reply('You dont have that many coins!');
        }
        if (amount > temp.t.coins) {
          confirmationCollector.stop();
          client.cd.delete(message.author.id);
          client.cd.delete(target.id);
          return message.reply(
            `${target.toString()} does not have enough coins!`
          );
        }
        await removeCoins(message.author.id, amount);
        await removeCoins(target.id, amount);
        confirmationCollector.stop();
        let hp = {
          user: 100,
          userT: 5,
          target: 100,
          targetT: 5
        };
        // start fight

        const embed = new EmbedBuilder()
          .setTitle(`${message.author.username} vs ${target.user.username}`)
          .setColor(Colors.Yellow)
          .setFooter({
            text: `Winner gets: ${amount.toLocaleString()} coins`
          })
          .setDescription(
            `**${message.author.tag}** (__100__) vs (__100__) **${target.user.tag}**`
          );
        const row = new ActionRowBuilder().addComponents([
          new ButtonBuilder()
            .setStyle(ButtonStyle.Danger)
            .setCustomId('fight_attack')
            .setLabel('Attack'),
          new ButtonBuilder()
            .setStyle(ButtonStyle.Success)
            .setCustomId('fight_heal')
            .setLabel('Heal')
        ]);
        const rand = [0, 1][Math.floor(Math.random() * 2)];
        const users = [message.author, target.user];
        let turn = users[rand];
        const fightMessage = await message.channel.send({
          embeds: [embed],
          components: [row],
          content: `${turn.toString()} your turn!`
        });

        const fightCollector = fightMessage.createMessageComponentCollector({
          filter: (m) => {
            if (!users.map((a) => a.id).includes(m.user.id)) {
              m.reply({
                content: 'This is not your fight!',
                ephemeral: true
              });
              return false;
            }
            return true;
          },
          idle: 10000
        });
        let winner = null;
        fightCollector.on('collect', async (m) => {
          if (hp.target < 1) {
            winner = message.author;
            fightCollector.stop();
            m.deferUpdate();
            return;
          } else if (hp.user < 1) {
            winner = target.user;
            fightCollector.stop();
            m.deferUpdate();
            return;
          }

          if (m.user.id !== turn.id) {
            return m.reply({
              content: 'This is not your turn!',
              ephemeral: true
            });
          }

          if (m.customId === 'fight_attack') {
            const damage = Math.floor(Math.random() * 20) + 5;
            if (turn.id == message.author.id) {
              hp.target -= damage;
            } else {
              hp.user -= damage;
            }
            turn = turn === users[0] ? users[1] : users[0];
            embed.setDescription(
              `**${message.author.tag}** (__${
                hp.user < 0 ? 0 : hp.user
              }__) vs (__${hp.target < 0 ? 0 : hp.target}__) **${
                target.user.tag
              }**`
            );
            await m.deferUpdate();
            if (hp.user <= 0) {
              winner = target.user;
              fightCollector.stop();
              embed.setDescription(
                `~~${
                  embed.data.description
                }~~\n\n:trophy: | **${target.user.toString()} has won the fight!**`
              );
              await addCoins(target.user.id, amount * 2);
            } else if (hp.target <= 0) {
              winner = message.author;
              fightCollector.stop();
              embed.setDescription(
                `~~${
                  embed.data.description
                }~~\n\n:trophy: | **${message.author.toString()} has won the fight!**`
              );
              await addCoins(message.author.id, amount * 2);
            }
          } else {
            const heal = 20;
            if (turn.id == message.author.id) {
              if (hp.userT < 1) {
                return m.reply({
                  content: 'You have used all your 5 heals.',
                  ephemeral: true
                });
              }
              hp.userT--;
              hp.user += heal;
            } else {
              if (hp.targetT < 1) {
                return m.reply({
                  content: 'You have used all your 5 heals.',
                  ephemeral: true
                });
              }
              hp.targetT--;
              hp.target += heal;
            }
            turn = turn === users[0] ? users[1] : users[0];
            embed.setDescription(
              `**${message.author.tag}** (__${
                hp.user < 0 ? 0 : hp.user
              }__) vs (__${hp.target < 0 ? 0 : hp.target}__) **${
                target.user.tag
              }**`
            );
            await m.deferUpdate();
          }

          fightMessage.edit({
            embeds: [embed],
            content: `${turn.toString()} its your turn!`
          });
        });
        fightCollector.on('end', async () => {
          if (!winner) {
            turn = turn === users[0] ? users[1] : users[0];
            embed.setDescription(
              `~~**${message.author.tag}** (__${
                hp.user < 0 ? 0 : hp.user
              }__) vs (__${hp.target < 0 ? 0 : hp.target}__) **${
                target.user.tag
              }**~~`
            );
            fightMessage.edit({
              embeds: [embed]
            });
            message.channel.send({
              content: `:trophy: | ${turn.toString()} has won the fight because their opponent abandoned the game.`
            });
            await addCoins(turn.id, amount * 2);
            client.cd.delete(message.author.id);
            client.cd.delete(target.id);
            return;
          }
          message.channel.send({
            content: `:trophy: | **${
              winner?.toString() || 'Noone'
            } has won the fight!**`
          });
          row.components.forEach((c) => {
            c.setDisabled();
          });
          fightMessage.edit({
            components: [row]
          });
          client.cd.delete(message.author.id);
          client.cd.delete(target.id);
        });
      } else if (m.customId === 'cancel') {
        confirmationCollector.stop();
        client.cd.delete(message.author.id);
        client.cd.delete(target.id);
        return message.reply(
          `${target.user.username} does not want to fight you.`
        );
      }
    });

    confirmationCollector.on('end', async () => {
      client.cd.delete(message.author.id);
      client.cd.delete(target.id);
      row.components.forEach((c) => {
        c.setDisabled(true);
      });
      confirmationMessage.edit({
        components: [row]
      });
    });
  }
};
/**
 * DB Functions
 */
const removeCoins = async (userId, amount) => {
  const user = await getUser(userId);
  user.coins -= Number(amount);
  user.save();
};
const addCoins = async (userId, amount) => {
  const user = await getUser(userId);
  user.coins += Number(amount);
  user.save();
};

const getUser = async (userId) => {
  let dbu = await Database.findOne({
    userId
  });
  if (!dbu) {
    dbu = new Database({
      userId,
      coins: 0
    });
  }
  return dbu;
};

/**
 * DB Functions
 */

const parseAmount = (string) => {
  // Checks if first digit is valid number
  if (isNaN(string[0])) return null;

  // Return if number is like "5e4" etc.
  if (!isNaN(Number(string))) return Number(string);

  // Check for "m", "k" etc. and return value
  if (!string.endsWith('m') && !string.endsWith('k') && !string.endsWith('b'))
    return null;

  // Add values of m, k and b
  const val = string[string.length - 1];
  const rawString = string.replace(string[string.length - 1], '');
  const calculated = parseInt(rawString) * StringValues[val];

  // Invalid number
  if (isNaN(calculated)) return null;
  else return calculated;
};

const StringValues = {
  m: 1e6,
  k: 1e3,
  b: 1e9
};
const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};
