const { Collection, Client, EmbedBuilder, Message } = require('discord.js');

const Game = new Collection();
const Messages = new Collection();

/**
 * @typedef {Object} Gamedata
 * @property {number} night
 * @property {Collection<string, {
 *   id: string;
 *   alive: boolean;
 *   messages: Collection<number, number>
 * }>} players
 */

module.exports = {
  name: 'messageCreate',
  /**
   *
   * @param {Message} message
   * @param {Client} client
   * @returns
   */
  async execute(message, client) {
    if (!message.guild || message.channel.type !== 'GUILD_TEXT') return;
    if (message.guild.id !== '824294231447044197') return;
    if (message.channel.name !== 'mafia') return;

    const mafia = '511786918783090688';
    const logChannel = '1340975244122259506';

    if (Game.has(message.channel.id)) {
      const currentGame = Game.get(message.channel.id);

      if (message.author.id === mafia) {
        const embed = message?.embeds[0];

        if (embed.title?.includes('Night')) {
          const currentNight = Number(embed.title?.match(/\d+/)[0]);

          currentGame.night = currentNight;

          const fields = embed.fields;

          const [alive, dead] = [[], []];

          for (const field of fields) {
            const userMatches = [...field.value.matchAll(/<@!?(\d+)>/g)];
            const userIds = userMatches.map((m) => m[1]);

            if (field.name.includes('Alive')) {
              for (const user of userIds) {
                const player = currentGame.players.get(user);
                if (player) player.alive = true;
                alive.push(user);
              }
            }

            if (field.name.includes('Dead')) {
              for (const user of userIds) {
                const player = currentGame.players.get(user);
                if (player) player.alive = false;
                dead.push(user);
              }
            }
          }

          try {
            const aliveDeadEmbed = new EmbedBuilder()
              .setTitle(`Night ${currentNight}`)
              .addFields([
                {
                  name: 'Alive',
                  value: alive.map((_, id) => `<@${id}>`).join('\n'),
                  inline: true
                },
                {
                  name: 'Dead',
                  value: dead.map((_, id) => `<@${id}>`).join('\n'),
                  inline: true
                }
              ]);

            const messageEmbed = new EmbedBuilder()
              .setTitle(`Night ${currentNight} messages`)
              .setDescription(
                currentGame.players
                  .filter((a) => a.alive)
                  .map((a) => {
                    const playerMessages = a.messages.get(currentNight) || 0;
                    return `<@${a.id}>: ${playerMessages}`;
                  })
                  .join('\n')
              );

            client.channels.cache
              .get(logChannel)
              ?.send({ embeds: [aliveDeadEmbed, messageEmbed] });
          } catch (error) {
            console.log(error);
          }
        }
      } else {
        const player = currentGame.players.get(message.author.id);

        if (player) {
          if (player.messages.has(currentGame.night)) {
            player.messages.set(
              currentGame.night,
              player.messages.get(currentGame.night) + 1
            );
          } else {
            player.messages.set(currentGame.night, 1);
          }
        }
      }
    } else {
      if (message.mentions.users.size > 0) {
        const players = new Collection();

        for (const [_, user] of message.mentions.users) {
          players.set(user.id, {
            id: user.id,
            alive: true,
            messages: new Collection()
          });
        }

        Game.set(message.channel.id, {
          players,
          night: 1
        });
      }
    }
  }
};
