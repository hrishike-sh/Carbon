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
const GAME_START_DELAY_MS = 5 * 1000;
const BASE_DAMAGE = 3;
const RANDOM_DAMAGE = 7;
const WEAPON_BONUS_DAMAGE = 10;
const BANDAID_HEAL_AMOUNT = 50;
const ROUND_TIME_MS = 10 * 1000;

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

    /** @type {Array<{id: string, name: string, health: number, weapon: boolean, bandaids: number}>} */
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
        weapon: false,
        bandaids: 0
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

      let gameRows = [];
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
      let playersWhoActedThisRound = new Set();
      let roundNumber = 0;
      let roundTimer = null;
      let playerChoosingTarget = null;

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

      function buildButtonRows() {
        const newGameRows = [];

        if (playerChoosingTarget) {
          const alivePlayers = players.filter(
            (p) => p.health > 0 && p.id !== playerChoosingTarget
          );
          const shuffledAlivePlayers = shuffleArray([...alivePlayers]);

          for (let i = 0; i < shuffledAlivePlayers.length; i++) {
            const player = shuffledAlivePlayers[i];
            const rowIndex = Math.floor(i / 5);
            if (!newGameRows[rowIndex]) {
              newGameRows.push(new ActionRowBuilder());
            }

            const button = new ButtonBuilder()
              .setLabel(`${player.name} (${player.health})`)
              .setCustomId(`br_p_${player.id}`)
              .setStyle(ButtonStyle.Primary)
              .setDisabled(false);

            newGameRows[rowIndex].addComponents(button);
          }
          newGameRows.push(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setLabel('Cancel Attack')
                .setCustomId('br_cancel_attack')
                .setStyle(ButtonStyle.Danger)
            )
          );
        } else {
          newGameRows.push(
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setLabel('Attack')
                .setCustomId('br_attack')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('⚔️'),
              new ButtonBuilder()
                .setLabel('Search')
                .setCustomId('br_search')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🔍'),
              new ButtonBuilder()
                .setLabel('Use Bandaid')
                .setCustomId('br_use_bandaid')
                .setStyle(ButtonStyle.Success)
                .setEmoji('🩹')
            )
          );
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
          (p) => p.health > 0 && !playersWhoActedThisRound.has(p.id)
        );

        const updatedRows = buildButtonRows();

        game_embed.setDescription(
          gameLog.map((a) => `- ${a}`).join('\n') || 'The game is afoot!'
        );

        const leftToAttackNames = playersLeftToAttack
          .map((p) => p.name)
          .join(', ');
        game_embed.setFields([
          {
            name: `Round ${roundNumber}`,
            value: `Choose your action! You have ${
              ROUND_TIME_MS / 1000
            } seconds!`
          },
          {
            name: 'Left to Act',
            value:
              leftToAttackNames.length > 0
                ? leftToAttackNames
                : 'Everyone has acted!'
          }
        ]);

        updateMessage(gameMessage, updatedRows, game_embed);
      }

      function startNewRound() {
        if (roundTimer) clearTimeout(roundTimer);

        roundNumber++;

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
        playersWhoActedThisRound.clear();
        playerChoosingTarget = null;
        updateGameMessage();

        roundTimer = setTimeout(() => {
          if (mainCollector.ended) return;
          const playersLeft = currentRoundPlayers.filter(
            (p) => p.health > 0 && !playersWhoActedThisRound.has(p.id)
          );
          if (playersLeft.length > 0) {
            gameLog.push(
              `*Time's up! Missed moves: ${playersLeft
                .map((p) => p.name)
                .join(', ')}*`
            );
          }
          startNewRound();
        }, ROUND_TIME_MS);
      }

      mainCollector.on('collect', async (interaction) => {
        const actor = players.find((p) => p.id === interaction.user.id);

        if (playerChoosingTarget) {
          if (actor.id !== playerChoosingTarget) {
            await interaction.reply({
              ephemeral: true,
              content: `Wait your turn! ${
                players.find((p) => p.id === playerChoosingTarget)?.name
              } is choosing a target.`
            });
            return;
          }

          if (interaction.customId === 'br_cancel_attack') {
            playerChoosingTarget = null;
            await interaction.deferUpdate();
            updateGameMessage();
            return;
          }

          if (interaction.customId.startsWith('br_p_')) {
            const victimId = interaction.customId.split('_')[2];
            const victim = players.find((p) => p.id === victimId);

            if (!victim) {
              await interaction.reply({
                ephemeral: true,
                content: "That player doesn't exist!"
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
            if (actor.weapon) {
              dmg += WEAPON_BONUS_DAMAGE;
            }

            victim.health -= dmg;
            await interaction.deferUpdate();

            if (victim.health <= 0) {
              victim.health = 0;
              gameLog.push(
                randomActions[Math.floor(Math.random() * randomActions.length)]
                  .replace('{user}', actor.name)
                  .replace('{target}', victim.name)
              );
            }

            playersWhoActedThisRound.add(actor.id);
            playerChoosingTarget = null;
          }
        } else {
          if (playersWhoActedThisRound.has(actor.id)) {
            await interaction.reply({
              ephemeral: true,
              content: 'You have already acted this round!'
            });
            return;
          }

          switch (interaction.customId) {
            case 'br_attack':
              playerChoosingTarget = actor.id;
              await interaction.deferUpdate();
              break;

            case 'br_search':
              playersWhoActedThisRound.add(actor.id);
              if (Math.random() > 0.5) {
                if (!actor.weapon) {
                  actor.weapon = true;
                  await interaction.reply({
                    ephemeral: true,
                    content: 'You searched and found a Dagger! 🗡'
                  });
                } else {
                  await interaction.reply({
                    ephemeral: true,
                    content:
                      'You searched and found another Dagger, but you already have one.'
                  });
                }
              } else {
                actor.bandaids++;
                await interaction.reply({
                  ephemeral: true,
                  content: 'You searched and found a Bandaid! 🩹'
                });
              }
              break;

            case 'br_use_bandaid':
              if (actor.bandaids <= 0) {
                await interaction.reply({
                  ephemeral: true,
                  content: "You don't have any bandaids to use!"
                });
                return;
              }
              playersWhoActedThisRound.add(actor.id);
              actor.bandaids--;
              actor.health += BANDAID_HEAL_AMOUNT;
              await interaction.reply({
                ephemeral: true,
                content: `You used a Bandaid and healed for ${BANDAID_HEAL_AMOUNT} HP! You now have ${actor.health} HP.`
              });
              break;
          }
        }

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

        const playersLeftToAct = currentRoundPlayers.filter(
          (p) => p.health > 0 && !playersWhoActedThisRound.has(p.id)
        );

        if (playersLeftToAct.length === 0) {
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
            .setCustomId(`br_final_${player.id}`)
            .setDisabled(true);

          if (player.health <= 0) {
            button.setStyle(ButtonStyle.Secondary).setEmoji('💀');
          } else {
            button.setStyle(ButtonStyle.Success);
            if (player.weapon) button.setEmoji('🗡');
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
  }
};
