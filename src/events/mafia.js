const {
  Message,
  Client,
  Colors,
  Collection,
  EmbedBuilder
} = require('discord.js');

const GAMEDATA = new Collection();
const MESSAGES = new Collection();

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
      console.log(`Game data found for channel ${channelId}`);
      const currentGame = GAMEDATA.get(channelId);

      if (message.author.id === mafiaBotId) {
        console.log(`Mafia bot sent a message in channel ${channelId}`);

        const embed = message.embeds[0];
        if (embed?.title?.includes('Night')) {
          console.log('Night message detected');

          const nightNumber = Number(embed.title.match(/\d+/)[0]);
          currentGame.night = nightNumber;

          console.log(`Night number: ${nightNumber}`);

          const fields = embed.fields;

          for (const field of fields) {
            const userMatches = [...field.value.matchAll(/<@!?(\d+)>/g)];
            const userIds = userMatches.map((m) => m[1]);

            if (field.name.includes('Alive')) {
              console.log('Processing alive players');
              for (const user of userIds) {
                const player = currentGame.players.get(user);
                if (player) player.alive = true;
              }
            }

            if (field.name.includes('Dead')) {
              console.log('Processing dead players');
              for (const user of userIds) {
                const player = currentGame.players.get(user);
                if (player) player.alive = false;
              }
            }
          }
          const logEmbed = new EmbedBuilder()
            .setTitle(`Night ${nightNumber}`)
            .setColor(Colors.Green)
            .setTimestamp(new Date())
            .addFields(
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
            );

          const msgEmbed = new EmbedBuilder()
            .setTitle(`Night ${nightNumber} messages`)
            .setColor(Colors.Green)
            .setDescription(
              currentGame.players
                .map(
                  (p) =>
                    `<@${p.id}>: ${
                      MESSAGES.get(`${channelId}-${p.id}`).filter(
                        (a) => a.night == nightNumber
                      ).length ?? 0
                    }`
                )
                .join('\n')
            );

          logChannel.send({ embeds: [logEmbed, msgEmbed] });
        }
      } else {
        console.log('Processing player message');
        const gameId = message.channel.id;
        const userId = currentGame.players.get(message.author.id);

        if (!userId) return;
        const userMessages = MESSAGES.get(`${gameId}-${userId}`);

        if (userMessages) {
          console.log('Adding to existing user messages');
          MESSAGES.get(`${gameId}-${userId}`).push({
            night: currentGame.night,
            content: message.content
          });
        } else {
          console.log('New user message');
          MESSAGES.set(`${gameId}-${userId}`, [
            {
              night: currentGame.night,
              content: message.content
            }
          ]);
        }
      }
    } else {
      console.log('No active game found');
      if (message.mentions.users.size > 0) {
        console.log(`New game started in channel ${channelId}`);

        const embed = new EmbedBuilder()
          .setTitle('New Mafia Game')
          .setTimestamp(new Date())
          .setColor(Colors.Green)
          .setDescription(
            `Players: ${message.mentions.users
              .map((u) => u.toString())
              .join(', ')}`
          );

        logChannel.send({ embeds: [embed] });

        const players = new Collection();

        for (const [_, player] of message.mentions.users) {
          players.set(player.id, {
            alive: true,
            id: player.id
          });
        }

        GAMEDATA.set(channelId, {
          players,
          night: 1
        });
      }
    }
  }
};
