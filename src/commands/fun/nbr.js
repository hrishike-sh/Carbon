const {
  Message,
  Client,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Colors,
  ComponentType
} = require('discord.js');

const ROLE_ID = '858088054942203945';
const MIN_PLAYERS = 3;
const MAX_PLAYERS = 25;
const JOIN_TIME_MS = 30 * 1000;
const UPGRADE_TIME_MS = 15 * 1000;
const GAME_START_DELAY_MS = 5 * 1000;
const BASE_DAMAGE = 3;
const RANDOM_DAMAGE = 7;
const WEAPON_BONUS_DAMAGE = 10;
const SHIELD_BONUS_HEALTH = 50;
const ROUND_TIME_MS = 3 * 1000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let LASTUPDATE = 0;
function updateMessage(msg, components, emb) {
  const NOW = Date.now();
  if (NOW - LASTUPDATE > 1000) {
    LASTUPDATE = NOW;
    msg.edit({ components, embeds: [emb] }).catch(console.error);
  }
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

const randomActions = [
  `**{user}** absolutely DESTROYED **{target}**!`,
  `**{target}** tried to run away from **{user}** but failed and DIED.`,
  `**{user}** used a dagger to kill **{target}**!`,
  `**{target}** was no match for **{user}**'s dagger and DIED.`,
  `**{user}** sneakily stabbed **{target}** to death.`,
  `**{target}** tried to dodge, but **{user}** was too quick and plunged their dagger into their heart.`,
  `**{user}** quickly disarmed **{target}**, then struck them with a fatal blow.`,
  `**{target}** tried to defend, but **{user}** was too quick and managed to evade their defense.`,
  `**{user}**'s dagger was too quick for **{target}**, and they fell to the ground, defeated.`,
  `**{target}** tried to counterattack, but **{user}**'s dagger was too fast and they fell to the ground, defeated.`
];

module.exports = {
  name: 'nbr',
  async execute(message, args, client) {
    if (!message.member.roles.cache.has(ROLE_ID)) {
      return message.reply(
        "You don't have the required role to start this game."
      );
    }

    const conf_embed = new EmbedBuilder()
      .setTitle('Battle Royale (Round-Based)')
      .setDescription(
        `Click the \`JOIN\` button to join!\n\nMax Players: ${MAX_PLAYERS}`
      )
      .setFooter({
        text: `Game starts in ${JOIN_TIME_MS / 1000} seconds.`
      })
      .setColor(Colors.Gold);

    const conf_row = new ActionRowBuilder().addComponents([
      new ButtonBuilder()
        .setLabel('JOIN')
        .setStyle(ButtonStyle.Success)
        .setCustomId('br_join')
    ]);

    const joinMessage = await message.channel.send({
      embeds: [conf_embed],
      components: [conf_row]
    });

    /** @type {Array<{id: string, name: string, health: number, weapon: boolean}>} */
    const players = [];

    const joinCollector = joinMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      filter: (interaction) => {
        if (players.some((p) => p.id === interaction.user.id)) {
          interaction.reply({
            ephemeral: true,
            content: 'You have already joined the game.'
          });
          return false;
        }
        return true;
      },
      time: JOIN_TIME_MS
    });

    joinCollector.on('collect', async (interaction) => {
      if (players.length >= MAX_PLAYERS) {
        joinCollector.stop('full');
        interaction.reply({
          ephemeral: true,
          content: 'The game is already full!'
        });
        return;
      }

      players.push({
        id: interaction.user.id,
        name: interaction.user.tag,
        health: 100,
        weapon: false
      });

      await interaction.reply({
        ephemeral: true,
        content: 'You have joined the game.'
      });

      if (players.length >= MAX_PLAYERS) {
        joinCollector.stop('full');
      }
    });

    joinCollector.on('end', async (collected, reason) => {
      conf_row.components[0].setDisabled(true);
      await joinMessage.edit({ components: [conf_row] });

      if (players.length < MIN_PLAYERS) {
        return message.channel.send(
          `You need at least ${MIN_PLAYERS} players to play. Game cancelled.`
        );
      }

      const upgradesEmbed = new EmbedBuilder()
        .setTitle('Select your upgrades!')
        .setColor(Colors.Green)
        .setFooter({
          text: `Game starts in ${UPGRADE_TIME_MS / 1000} seconds.`
        })
        .setDescription(
          `Players: ${players.map((a) => `<@${a.id}>`).join(' ')}\n\n` +
            `**Weapon**: __+${WEAPON_BONUS_DAMAGE}__ Attack Damage\n` +
            `**Shield**: __+${SHIELD_BONUS_HEALTH}__ Health`
        );

      const upgradesRow = new ActionRowBuilder().addComponents([
        new ButtonBuilder()
          .setLabel('Weapon')
          .setStyle(ButtonStyle.Success)
          .setEmoji('🗡')
          .setCustomId('br_up_wp'),
        new ButtonBuilder()
          .setLabel('Shield')
          .setStyle(ButtonStyle.Success)
          .setEmoji('🛡')
          .setCustomId('br_up_sh')
      ]);

      const upgradesMessage = await message.channel.send({
        embeds: [upgradesEmbed],
        components: [upgradesRow]
      });

      const upgradeCollector = upgradesMessage.createMessageComponentCollector({
        componentType: ComponentType.Button,
        filter: (interaction) => {
          const player = players.find((p) => p.id === interaction.user.id);
          if (!player) {
            interaction.reply({
              ephemeral: true,
              content: "You're not in this game!"
            });
            return false;
          }
          if (player.weapon || player.health > 100) {
            interaction.reply({
              ephemeral: true,
              content: "You can't upgrade more than once!"
            });
            return false;
          }
          return true;
        },
        time: UPGRADE_TIME_MS
      });

      upgradeCollector.on('collect', async (button) => {
        const player = players.find((a) => a.id == button.user.id);

        if (button.customId === 'br_up_sh') {
          player.health += SHIELD_BONUS_HEALTH;
          await button.reply({
            ephemeral: true,
            content: `You have upgraded your shield! You now have **${player.health}** Health!`
          });
        } else if (button.customId === 'br_up_wp') {
          player.weapon = true;
          await button.reply({
            ephemeral: true,
            content: `You have upgraded your weapon! You now deal **+${WEAPON_BONUS_DAMAGE}** damage!`
          });
        }
      });

      upgradeCollector.on('end', async () => {
        upgradesRow.components.forEach((a) => a.setDisabled(true));
        await upgradesMessage.edit({ components: [upgradesRow] });

        let gameRows = [];
        for (let i = 0; i < players.length; i++) {
          const rowIndex = Math.floor(i / 5);
          if (!gameRows[rowIndex]) {
            gameRows.push(new ActionRowBuilder());
          }
          const player = players[i];
          const button = new ButtonBuilder()
            .setLabel(`${player.name} (${player.health})`)
            .setStyle(ButtonStyle.Secondary)
            .setCustomId(`br_${player.id}`)
            .setDisabled(true);
          if (player.weapon) button.setEmoji('🗡');
          else if (player.health > 100) button.setEmoji('🛡');
          gameRows[rowIndex].addComponents(button);
        }

        const game_embed = new EmbedBuilder()
          .setTitle('Battle Royale')
          .setColor(Colors.Gold)
          .setFooter({ text: 'Last man standing wins!' })
          .setDescription(
            `The game starts in **${GAME_START_DELAY_MS / 1000} seconds**.\n` +
              `Wait for the round to begin!`
          );

        const gameMessage = await message.channel.send({
          components: gameRows,
          embeds: [game_embed]
        });

        await sleep(GAME_START_DELAY_MS);

        let gameLog = [];
        let winner = null;
        let currentRoundPlayers = [];
        let playersWhoAttackedThisRound = new Set();
        let roundNumber = 0;
        let roundTimer = null;

        const mainCollector = gameMessage.createMessageComponentCollector({
          componentType: ComponentType.Button,
          filter: (interaction) => {
            const player = players.find((p) => p.id === interaction.user.id);
            if (!player) {
              interaction.reply({
                ephemeral: true,
                content: "You're not in this game!"
              });
              return false;
            }
            if (player.health <= 0) {
              interaction.reply({
                ephemeral: true,
                content: "You're already dead!"
              });
              return false;
            }
            return true;
          }
        });

        function buildPlayerButtonRows() {
          const alivePlayers = players.filter((p) => p.health > 0);
          const shuffledAlivePlayers = shuffleArray([...alivePlayers]);

          const newGameRows = [];
          for (let i = 0; i < shuffledAlivePlayers.length; i++) {
            const player = shuffledAlivePlayers[i];
            const rowIndex = Math.floor(i / 5);
            if (!newGameRows[rowIndex]) {
              newGameRows.push(new ActionRowBuilder());
            }

            const button = new ButtonBuilder()
              .setLabel(`${player.name} (${player.health})`)
              .setCustomId(`br_${player.id}`)
              .setStyle(ButtonStyle.Primary)
              .setDisabled(false);

            if (player.weapon) button.setEmoji('🗡');
            else if (player.health > 100) button.setEmoji('🛡');

            newGameRows[rowIndex].addComponents(button);
          }

          gameRows.length = 0;
          gameRows.push(...newGameRows);
          return newGameRows;
        }

        function updateGameMessage() {
          const alivePlayers = players.filter((p) => p.health > 0);

          if (alivePlayers.length === 1) {
            winner = alivePlayers[0];
            mainCollector.stop('winner');
            return;
          }
          if (alivePlayers.length === 0) {
            mainCollector.stop('draw');
            return;
          }

          const playersLeftToAttack = currentRoundPlayers.filter(
            (p) => p.health > 0 && !playersWhoAttackedThisRound.has(p.id)
          );

          const updatedRows = buildPlayerButtonRows();

          game_embed.setDescription(
            gameLog.map((a) => `- ${a}`).join('\n') || 'The game is afoot!'
          );

          const leftToAttackNames = playersLeftToAttack
            .map((p) => p.name)
            .join(', ');
          game_embed.setFields([
            {
              name: `Round ${roundNumber}`,
              value: `Everyone can attack ONCE this round. You have ${
                ROUND_TIME_MS / 1000
              } seconds!`
            },
            {
              name: 'Left to Attack',
              value:
                leftToAttackNames.length > 0
                  ? leftToAttackNames
                  : 'Everyone has attacked!'
            }
          ]);

          updateMessage(gameMessage, updatedRows, game_embed);
        }

        function startNewRound() {
          if (roundTimer) clearTimeout(roundTimer);

          roundNumber++;
          gameLog.push(`--- **Round ${roundNumber} Begins!** ---`);

          const alivePlayers = players.filter((p) => p.health > 0);

          if (alivePlayers.length === 1) {
            winner = alivePlayers[0];
            mainCollector.stop('winner');
            return;
          }
          if (alivePlayers.length === 0) {
            mainCollector.stop('draw');
            return;
          }

          currentRoundPlayers = [...alivePlayers];
          playersWhoAttackedThisRound.clear();
          updateGameMessage();

          roundTimer = setTimeout(() => {
            if (mainCollector.ended) return;

            const playersLeft = currentRoundPlayers.filter(
              (p) => p.health > 0 && !playersWhoAttackedThisRound.has(p.id)
            );

            gameLog.push(`--- **Round ${roundNumber} Ends (Time's Up!)** ---`);
            if (playersLeft.length > 0) {
              gameLog.push(
                `*Missed moves: ${playersLeft.map((p) => p.name).join(', ')}*`
              );
            }

            startNewRound();
          }, ROUND_TIME_MS);
        }

        mainCollector.on('collect', async (interaction) => {
          const attacker = players.find((p) => p.id === interaction.user.id);

          if (playersWhoAttackedThisRound.has(attacker.id)) {
            await interaction.reply({
              ephemeral: true,
              content: 'You have already attacked this round!'
            });
            return;
          }

          const victimId = interaction.customId.split('_')[1];
          const victim = players.find((p) => p.id === victimId);

          if (victim.id === attacker.id) {
            await interaction.reply({
              ephemeral: true,
              content: "You can't attack yourself!"
            });
            return;
          }

          if (victim.health <= 0) {
            await interaction.reply({
              ephemeral: true,
              content: 'That player is already dead!'
            });
            return;
          }

          let dmg = BASE_DAMAGE + Math.ceil(Math.random() * RANDOM_DAMAGE);
          if (attacker.weapon) {
            dmg += WEAPON_BONUS_DAMAGE;
          }

          victim.health -= dmg;
          await interaction.deferUpdate();

          if (victim.health <= 0) {
            victim.health = 0;
            gameLog.push(
              randomActions[Math.floor(Math.random() * randomActions.length)]
                .replace('{user}', attacker.name)
                .replace('{target}', victim.name)
            );
          } else {
            gameLog.push(
              `**${attacker.name}** attacked **${victim.name}** for **${dmg}** damage! (${victim.health} HP remaining)`
            );
          }

          playersWhoAttackedThisRound.add(attacker.id);

          const alivePlayers = players.filter((p) => p.health > 0);
          if (alivePlayers.length === 1) {
            winner = alivePlayers[0];
            mainCollector.stop('winner');
            return;
          }
          if (alivePlayers.length === 0) {
            mainCollector.stop('draw');
            return;
          }

          const playersLeftToAttack = currentRoundPlayers.filter(
            (p) => p.health > 0 && !playersWhoAttackedThisRound.has(p.id)
          );

          if (playersLeftToAttack.length === 0) {
            gameLog.push(`--- **Round ${roundNumber} Ends!** ---`);
            startNewRound();
          } else {
            updateGameMessage();
          }
        });

        mainCollector.on('end', async (collected, reason) => {
          if (roundTimer) clearTimeout(roundTimer);

          const finalGameRows = [];
          for (let i = 0; i < players.length; i++) {
            const player = players[i];
            const rowIndex = Math.floor(i / 5);
            if (!finalGameRows[rowIndex]) {
              finalGameRows.push(new ActionRowBuilder());
            }

            const button = new ButtonBuilder()
              .setLabel(`${player.name} (${player.health})`)
              .setCustomId(`br_${player.id}`)
              .setDisabled(true);

            if (player.health <= 0) {
              button.setStyle(ButtonStyle.Secondary).setEmoji('💀');
            } else {
              button.setStyle(ButtonStyle.Success);
              if (player.weapon) button.setEmoji('🗡');
              else if (player.health > 100) button.setEmoji('🛡');
            }
            finalGameRows[rowIndex].addComponents(button);
          }

          const finalEmbed = new EmbedBuilder()
            .setTitle('Battle Royale Over!')
            .setColor(Colors.Gold)
            .setDescription(
              gameLog.map((a) => `- ${a}`).join('\n') || 'The game has ended.'
            )
            .setFields([]);

          if (winner) {
            finalEmbed
              .addFields({
                name: 'Winner!',
                value: `Congratulations <@${winner.id}>!`
              })
              .setColor(Colors.Green);
          } else if (reason === 'draw') {
            finalEmbed
              .addFields({
                name: 'Result',
                value: "It's a draw! Everyone is dead."
              })
              .setColor(Colors.Red);
          }

          await gameMessage.edit({
            embeds: [finalEmbed],
            components: finalGameRows
          });
          message.channel.send(`**The Battle Royale has concluded!**`);
        });

        startNewRound();
      });
    });
  }
};
