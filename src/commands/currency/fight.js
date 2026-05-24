const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require('discord.js');
const config = require('../../config');
const { CoinService } = require('../../database/services/coinService');
const cooldowns = require('../../command/cooldowns');
const { parseAmount } = require('../../utils/validators');
const { Theme } = require('../../utils/embeds');

module.exports = {
  name: 'fight',

  async execute(message, args, client) {
    if (message.guild.id !== config.ids.guildId) return;
    const target = message.mentions.members.first();
    if (!target) return message.reply('You have to mention someone!');
    if (target.user.id === message.author.id)
      return message.reply("You can't fight yourself!");
    args.shift();
    const amount = parseAmount(args[0]);
    if (!amount) return message.reply('Mention the bet!');

    const userBal = await CoinService.getBalance(message.author.id);
    const targetBal = await CoinService.getBalance(target.id);
    if (amount > userBal) return message.reply('You dont have that many coins!');
    if (amount > targetBal)
      return message.reply(`${target.toString()} does not have enough coins!`);

    if (cooldowns.isLocked(message.author.id) || cooldowns.isLocked(target.id)) {
      return message.reply('Either you or your opponent is already in a game..');
    }
    cooldowns.lock(message.author.id);
    cooldowns.lock(target.id);

    const row = new ActionRowBuilder().addComponents([
      new ButtonBuilder().setStyle(ButtonStyle.Success).setCustomId('confirm').setLabel('Confirm'),
      new ButtonBuilder().setStyle(ButtonStyle.Danger).setCustomId('cancel').setLabel('Cancel')
    ]);

    const confirmationMessage = await message.channel.send({
      content: `${target.toString()} do you want to fight ${message.author.toString()} for ${amount.toLocaleString()} coins?`,
      components: [row]
    });

    const confirmationCollector = confirmationMessage.createMessageComponentCollector({
      filter: (m) => m.user.id === target.id,
      idle: 25_000
    });

    confirmationCollector.on('collect', async (m) => {
      if (m.customId === 'cancel') {
        confirmationCollector.stop();
        cooldowns.unlock(message.author.id);
        cooldowns.unlock(target.id);
        return message.reply(`${target.user.username} does not want to fight you.`);
      }

      const freshUserBal = await CoinService.getBalance(message.author.id);
      const freshTargetBal = await CoinService.getBalance(target.id);
      if (amount > freshUserBal || amount > freshTargetBal) {
        confirmationCollector.stop();
        cooldowns.unlock(message.author.id);
        cooldowns.unlock(target.id);
        return message.reply('Someone no longer has enough coins!');
      }

      await CoinService.removeCoins(message.author.id, amount);
      await CoinService.removeCoins(target.id, amount);
      confirmationCollector.stop();

      const hp = { user: 100, userT: 5, target: 100, targetT: 5 };
      const users = [message.author, target.user];
      let turn = users[Math.floor(Math.random() * 2)];

      const embed = new EmbedBuilder()
        .setTitle(`${message.author.username} vs ${target.user.username}`)
        .setColor(Theme.warning)
        .setFooter({ text: `Carbon • Winner gets: ${amount.toLocaleString()} coins` })
        .setDescription(
          `**${message.author.tag}** (__100__) vs (__100__) **${target.user.tag}**`
        );

      const fightRow = new ActionRowBuilder().addComponents([
        new ButtonBuilder().setStyle(ButtonStyle.Danger).setCustomId('fight_attack').setLabel('Attack'),
        new ButtonBuilder().setStyle(ButtonStyle.Success).setCustomId('fight_heal').setLabel('Heal')
      ]);

      const fightMessage = await message.channel.send({
        embeds: [embed],
        components: [fightRow],
        content: `${turn.toString()} your turn!`
      });

      const fightCollector = fightMessage.createMessageComponentCollector({
        filter: (btn) => {
          if (!users.map((a) => a.id).includes(btn.user.id)) {
            btn.reply({ content: 'This is not your fight!', ephemeral: true });
            return false;
          }
          return true;
        },
        idle: 10000
      });

      let winner = null;

      fightCollector.on('collect', async (btn) => {
        if (hp.target < 1 || hp.user < 1) {
          btn.deferUpdate();
          return;
        }

        if (btn.user.id !== turn.id) {
          return btn.reply({ content: 'This is not your turn!', ephemeral: true });
        }

        if (btn.customId === 'fight_attack') {
          const damage = Math.floor(Math.random() * 20) + 5;
          if (turn.id === message.author.id) {
            hp.target -= damage;
          } else {
            hp.user -= damage;
          }
          turn = turn === users[0] ? users[1] : users[0];
          embed.setDescription(
            `**${message.author.tag}** (__${Math.max(0, hp.user)}__) vs (__${Math.max(0, hp.target)}__) **${target.user.tag}**`
          );
          await btn.deferUpdate();

          if (hp.user <= 0) {
            winner = target.user;
            fightCollector.stop();
            embed.setDescription(
              `~~${embed.data.description}~~\n\n${target.user.toString()} has won the fight!`
            );
            await CoinService.addCoins(target.user.id, amount * 2);
          } else if (hp.target <= 0) {
            winner = message.author;
            fightCollector.stop();
            embed.setDescription(
              `~~${embed.data.description}~~\n\n${message.author.toString()} has won the fight!`
            );
            await CoinService.addCoins(message.author.id, amount * 2);
          }
        } else {
          const heal = 20;
          if (turn.id === message.author.id) {
            if (hp.userT < 1) {
              return btn.reply({ content: 'You have used all your 5 heals.', ephemeral: true });
            }
            hp.userT--;
            hp.user += heal;
          } else {
            if (hp.targetT < 1) {
              return btn.reply({ content: 'You have used all your 5 heals.', ephemeral: true });
            }
            hp.targetT--;
            hp.target += heal;
          }
          turn = turn === users[0] ? users[1] : users[0];
          embed.setDescription(
            `**${message.author.tag}** (__${Math.max(0, hp.user)}__) vs (__${Math.max(0, hp.target)}__) **${target.user.tag}**`
          );
          await btn.deferUpdate();
        }

        fightMessage.edit({
          embeds: [embed],
          content: `${turn.toString()} its your turn!`
        });
      });

      fightCollector.on('end', async () => {
        if (!winner) {
          const other = turn === users[0] ? users[1] : users[0];
          embed.setDescription(
            `~~**${message.author.tag}** (__${Math.max(0, hp.user)}__) vs (__${Math.max(0, hp.target)}__) **${target.user.tag}**~~`
          );
          fightMessage.edit({ embeds: [embed] });
          message.channel.send({
            content: `${other.toString()} has won the fight because their opponent abandoned the game.`
          });
          await CoinService.addCoins(other.id, amount * 2);
        } else {
          message.channel.send({
            content: `**${winner.toString()} has won the fight!**`
          });
        }
        fightRow.components.forEach((c) => c.setDisabled());
        fightMessage.edit({ components: [fightRow] });
        cooldowns.unlock(message.author.id);
        cooldowns.unlock(target.id);
      });
    });

    confirmationCollector.on('end', () => {
      cooldowns.unlock(message.author.id);
      cooldowns.unlock(target.id);
      row.components.forEach((c) => c.setDisabled(true));
      confirmationMessage.edit({ components: [row] });
    });
  }
};
