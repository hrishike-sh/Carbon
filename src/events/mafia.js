const {
  Collection,
  Client,
  EmbedBuilder,
  Message,
  ChannelType
} = require('discord.js');

const Game = new Collection();

/**
 * @typedef {Object} Gamedata
 * @property {number} night
 * @property {Collection<string, {
 *   id: string;
 *   alive: boolean;
 *   messages: Collection<number, number>;
 * }>} players
 */

module.exports = {
  name: 'messageCreate',

  /**
   * @param {Message} message
   * @param {Client} client
   */
  async execute(message, client) {
    if (!message.guild || message.channel.type !== ChannelType.GuildText)
      return;
    if (message.guild.id !== '824294231447044197') return;
    if (message.channel.name !== 'mafia') return;

    const mafia = '511786918783090688';
    const logChannelId = '1340975244122259506';

    if (Game.has(message.channel.id)) {
      const currentGame = Game.get(message.channel.id);

      if (message.author.id === mafia) {
        const embed = message.embeds?.[0];
        if (!embed?.title?.includes('Night')) return;

        const currentNight = Number(embed.title.match(/\d+/)?.[0] || 1);
        currentGame.night = currentNight;

        const fields = embed.fields ?? [];
        const alive = [];
        const dead = [];

        for (const field of fields) {
          const userIds = [...field.value.matchAll(/<@!?(\d+)>/g)].map(
            (m) => m[1]
          );

          for (const userId of userIds) {
            const player = currentGame.players.get(userId);
            if (!player) continue;

            if (field.name.includes('Alive')) {
              player.alive = true;
              alive.push(userId);
            } else if (field.name.includes('Dead')) {
              player.alive = false;
              dead.push(userId);
            }
          }
        }

        try {
          const aliveDeadEmbed = new EmbedBuilder()
            .setTitle(`Night ${currentNight - 1}`)
            .addFields([
              {
                name: 'Alive',
                value:
                  alive.map((userId) => `<@${userId}>`).join('\n') || 'None',
                inline: true
              },
              {
                name: 'Dead',
                value:
                  dead.map((userId) => `<@${userId}>`).join('\n') || 'None',
                inline: true
              }
            ]);

          const messageEmbed = new EmbedBuilder()
            .setTitle(`Night ${currentNight - 1} messages`)
            .setDescription(
              currentGame.players
                .filter((p) => p.alive)
                .map((p) => {
                  console.log(p);
                  return `<@${p.id}>: ${p.messages.get(currentNight - 1) || 0}`;
                })
                .join('\n') || 'No messages yet.'
            );

          const logChannel = client.channels.cache.get(logChannelId);
          if (logChannel?.isTextBased()) {
            console.log('Sending logs to log channel');
            await logChannel.send({
              embeds:
                currentNight === 1
                  ? aliveDeadEmbed
                  : [aliveDeadEmbed, messageEmbed]
            });
          }
        } catch (error) {
          console.error('Error sending logs:', error);
        }
      } else {
        const player = currentGame.players.get(message.author.id);
        if (!player) return;

        const prev = player.messages.get(currentGame.night) || 0;
        console.log(`Adding 1 message to ${message.author.tag}`);
        player.messages.set(currentGame.night, prev + 1);
      }
    } else {
      // Start new game if users are mentioned
      if (message.mentions.users.size > 0) {
        const players = new Collection();
        for (const [_, user] of message.mentions.users) {
          console.log(`Adding ${user.tag} to the game`);
          players.set(user.id, {
            id: user.id,
            alive: true,
            messages: new Collection()
          });
        }

        Game.set(message.channel.id, {
          night: 1,
          players
        });
      }
    }
  }
};
