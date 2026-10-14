const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const config = require('../../config');
const { CoinService, InsufficientFundsError } = require('../../database/services/coinService');
const cooldowns = require('../../command/cooldowns');
const { parseAmount } = require('../../utils/validators');
const { Theme } = require('../../utils/embeds');
const logger = require('../../utils/logger');

module.exports = {
  name: 'fight',

  async execute(message, args) {
    if (message.guild.id !== config.ids.guildId) return;
    const target = message.mentions.members.first();
    if (!target) return message.reply('You have to mention someone!');
    if (target.id === message.author.id) return message.reply("You can't fight yourself!");
    if (target.user.bot) return message.reply("You can't fight a bot!");
    const amount = parseAmount(args[1]);
    if (!amount || !Number.isSafeInteger(amount * 2)) return message.reply('Mention a valid bet!');

    const userId = message.author.id;
    if (!cooldowns.lock(userId)) return message.reply('Either you or your opponent is already in a game..');
    if (!cooldowns.lock(target.id)) {
      cooldowns.unlock(userId);
      return message.reply('Either you or your opponent is already in a game..');
    }
    let released = false;
    const unlock = () => {
      if (released) return;
      released = true;
      cooldowns.unlock(userId);
      cooldowns.unlock(target.id);
    };

    try {
      const [userBalance, targetBalance] = await Promise.all([
        CoinService.getBalance(userId), CoinService.getBalance(target.id)
      ]);
      if (amount > userBalance || amount > targetBalance) {
        unlock();
        return message.reply('Someone does not have enough coins!');
      }
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setStyle(ButtonStyle.Success).setCustomId('confirm').setLabel('Confirm'),
        new ButtonBuilder().setStyle(ButtonStyle.Danger).setCustomId('cancel').setLabel('Cancel')
      );
      const confirmation = await message.channel.send({
        content: `${target.toString()} do you want to fight ${message.author.toString()} for ${amount.toLocaleString()} coins?`,
        components: [row]
      });
      const collector = confirmation.createMessageComponentCollector({
        filter: (button) => button.user.id === target.id,
        idle: 25_000
      });
      collector.once('collect', (button) => {
        const accepted = button.customId === 'confirm';
        collector.stop(accepted ? 'accepted' : 'declined');
        (async () => {
          await button.deferUpdate();
          if (!accepted) {
            await message.reply(`${target.user.username} does not want to fight you.`);
            return;
          }
          const debited = [];
          try {
            await CoinService.removeCoins(userId, amount);
            debited.push(userId);
            await CoinService.removeCoins(target.id, amount);
            debited.push(target.id);
            await startFight(message, target, amount, unlock);
          } catch (err) {
            // A declined second debit or failed game message must not strand
            // the first player's stake.
            const refunds = await Promise.allSettled(debited.map((id) => CoinService.addCoins(id, amount)));
            refunds.forEach((result) => {
              if (result.status === 'rejected') logger.error('Failed to refund fight stake', result.reason);
            });
            unlock();
            if (err instanceof InsufficientFundsError) {
              await message.reply('Someone no longer has enough coins!');
              return;
            }
            throw err;
          }
        })().catch((err) => {
          logger.error('Failed to start fight', err);
          if (accepted) unlock();
        });
      });
      collector.once('end', (_, reason) => {
        // The active fight owns these locks after acceptance.
        if (reason !== 'accepted') unlock();
        row.components.forEach((button) => button.setDisabled(true));
        confirmation.edit({ components: [row] }).catch((err) => logger.error('Failed to close fight invitation', err));
      });
    } catch (err) {
      unlock();
      throw err;
    }
  }
};

async function startFight(message, target, amount, unlock) {
  const players = [message.author, target.user];
  const health = [100, 100];
  const heals = [5, 5];
  let turn = Math.floor(Math.random() * 2);
  let winner = null;
  let busy = false;
  let ended = false;
  const embed = new EmbedBuilder()
    .setTitle(`${message.author.username} vs ${target.user.username}`)
    .setColor(Theme.warning)
    .setFooter({ text: `Carbon • Winner gets: ${(amount * 2).toLocaleString()} coins` });
  const describe = () => embed.setDescription(
    `**${players[0].tag}** (__${Math.max(0, health[0])}__) vs (__${Math.max(0, health[1])}__) **${players[1].tag}**`
  );
  describe();
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setStyle(ButtonStyle.Danger).setCustomId('fight_attack').setLabel('Attack'),
    new ButtonBuilder().setStyle(ButtonStyle.Success).setCustomId('fight_heal').setLabel('Heal')
  );
  const gameMessage = await message.channel.send({
    embeds: [embed], components: [row], content: `${players[turn].toString()} your turn!`
  });
  const collector = gameMessage.createMessageComponentCollector({
    filter: (button) => players.some((player) => player.id === button.user.id),
    idle: 10000
  });

  collector.on('collect', (button) => {
    if (busy || ended) {
      button.deferUpdate().catch((err) => logger.error('Failed to acknowledge fight button', err));
      return;
    }
    if (button.user.id !== players[turn].id) {
      button.reply({ content: 'This is not your turn!', flags: 64 }).catch((err) => logger.error('Failed to reply to fight button', err));
      return;
    }
    busy = true;
    (async () => {
      await button.deferUpdate();
      if (ended) return;
      if (button.customId === 'fight_attack') {
        health[1 - turn] -= Math.floor(Math.random() * 20) + 5;
        if (health[1 - turn] <= 0) winner = players[turn];
      } else if (button.customId === 'fight_heal') {
        if (heals[turn] < 1) {
          await button.followUp({ content: 'You have used all your 5 heals.', flags: 64 });
          return;
        }
        heals[turn]--;
        health[turn] += 20;
      } else {
        return;
      }
      turn = 1 - turn;
      describe();
      if (winner) {
        collector.stop('won');
        return;
      }
      await gameMessage.edit({ embeds: [embed], content: `${players[turn].toString()} your turn!` });
    })().catch((err) => {
      // A transient Discord edit failure does not change the recorded turn or
      // pay out a second time; the collector's timeout still settles the game.
      logger.error('Failed to update fight', err);
    }).finally(() => { busy = false; });
  });

  collector.once('end', () => {
    ended = true;
    const abandoned = !winner;
    winner ||= players[1 - turn];
    (async () => {
      try {
        await CoinService.addCoins(winner.id, amount * 2);
        describe();
        embed.setDescription(`~~${embed.data.description}~~\n\n${winner.toString()} has won the fight!`);
        row.components.forEach((button) => button.setDisabled(true));
        await gameMessage.edit({
          embeds: [embed], components: [row],
          content: abandoned
            ? `${winner.toString()} has won the fight because their opponent abandoned the game.`
            : `**${winner.toString()} has won the fight!**`
        });
      } finally {
        unlock();
      }
    })().catch((err) => logger.error('Failed to settle fight', err));
  });
}
