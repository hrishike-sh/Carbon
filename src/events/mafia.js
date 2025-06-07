const { Message, Client, Colors, Collection } = require('discord.js');

const GAMEDATA = new Collection();

module.exports = {
  name: 'messageCreate',
  once: false,
  /**
   * @param {Message} message
   * @param {Client} client
   */
  execute: async (message, client) => {
    if (!message.guild || message.guild.id !== '824294231447044197') return;
    if (message.channel.name !== 'mafia') return;

    const mafiaBotId = '511786918783090688';
    const channelId = message.channel.id;
    const logChannel = client.channels.cache.get('1340975244122259506');

    if (GAMEDATA.has(channelId)) {
      const currentGame = GAMEDATA.get(channelId);

      if (message.author.id === mafiaBotId) {
        console.log(`Mafia bot sent a message in channel ${channelId}`);

        const embed = message.embeds[0];
        if (embed?.title?.includes('Night')) {
          console.log('Night message detected');

          const nightNumber = Number(embed.title.match(/\d+/)[0]);
          console.log(`Night number: ${nightNumber}`);

          const fields = embed.fields;

          for (const field of fields) {
            const userMatches = [...field.value.matchAll(/<@!?(\d+)>/g)];
            const userIds = userMatches.map((m) => m[1]);

            if (field.name.includes('Alive')) {
              for (const user of userIds) {
                const player = currentGame.players.get(user);
                if (player) player.alive = true;
              }
            }

            if (field.name.includes('Dead')) {
              for (const user of userIds) {
                const player = currentGame.players.get(user);
                if (player) player.alive = false;
              }
            }
          }

          if (nightNumber === 1) {
            logChannel.send({
              embeds: [
                {
                  title: 'New mafia game started!',
                  color: Colors.Green,
                  description: `Players: ${currentGame.players
                    .map((_, id) => `<@${id}>`)
                    .join(', ')}`,
                  timestamp: new Date()
                }
              ]
            });
          } else {
            logChannel.send({
              embeds: [
                {
                  title: `Night ${nightNumber}`,
                  color: Colors.Green,
                  timestamp: new Date(),
                  fields: [
                    {
                      name: 'Alive',
                      value:
                        currentGame.players
                          .filter((p) => p.alive)
                          .map((_, id) => `<@${id}>`)
                          .join('\n') || 'None',
                      inline: true
                    },
                    {
                      name: 'Dead',
                      value:
                        currentGame.players
                          .filter((p) => !p.alive)
                          .map((_, id) => `<@${id}>`)
                          .join('\n') || 'None',
                      inline: true
                    }
                  ]
                }
              ]
            });

            logChannel.send({
              embeds: [
                {
                  title: `Night ${nightNumber} messages`,
                  color: Colors.Green,
                  timestamp: new Date(),
                  description:
                    currentGame.players
                      .filter((p) => p.alive)
                      .map((p, id) => `<@${id}>: ${p.nights[nightNumber] || 0}`)
                      .join('\n') || 'No messages'
                }
              ]
            });
          }

          currentGame.night = nightNumber;
        }
      } else {
        const userId = message.author.id;
        const currentPlayer = currentGame.players.get(userId);
        if (!currentPlayer) return;

        const currentNight = currentGame.night;
        const messageCount = currentPlayer.nights[currentNight] ?? 0;

        currentGame.players.set(userId, {
          ...currentPlayer,
          nights: {
            ...currentPlayer.nights,
            [currentNight]: messageCount + 1
          }
        });

        console.log(
          `User ${message.author.tag} sent message during night ${currentNight}`
        );
      }
    } else {
      // New game trigger
      if (message.mentions.users.size > 0) {
        console.log(`New game started in channel ${channelId}`);
        const players = new Collection();

        for (const [_, player] of message.mentions.users) {
          players.set(player.id, {
            alive: true,
            nights: {}
          });
        }

        GAMEDATA.set(channelId, {
          players,
          night: 0
        });
      }
    }
  }
};
