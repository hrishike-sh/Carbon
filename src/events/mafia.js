const {
  Collection,
  Client,
  EmbedBuilder,
  Message,
  ChannelType,
  Colors
} = require('discord.js');
const os = require('os');
const discordTranscripts = require('discord-html-transcripts');
const path = require('path');
const fs = require('fs');

const Game = new Collection();
const Messages = new Collection();

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

    const mafiaIds = ['511786918783090688', '758999095070687284'];
    const logChannelId = '1340975244122259506';
    const logChannel = client.channels.cache.get(logChannelId);

    if (Game.has(message.channel.id)) {
      const currentGame = Game.get(message.channel.id);

      if (Messages.has(message.channel.id)) {
        Messages.get(message.channel.id).push(message);
      } else {
        Messages.set(message.channel.id, [message]);
      }

      if (mafiaIds.includes(message.author.id)) {
        const embed = message.embeds?.[0];
        if (embed?.title?.includes('Night')) {
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
                if (!player.alive) continue;
                player.alive = false;
                player.deadAt = currentNight - 1;
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
              ])
              .setColor(Colors.Yellow);

            const messageEmbed = new EmbedBuilder()
              .setTitle(`Night ${currentNight - 1} messages`)
              .setDescription(
                currentGame.players
                  .filter((p) => p.alive)
                  .map((p) => {
                    const messages = p.messages.get(currentNight - 1) || 0;
                    return `<:dot:931436867272998922> <@${
                      p.id
                    }> => ${messages}/3 ${
                      messages >= 3
                        ? '<:TickYes:962407492300705834>'
                        : '<:TickNo:962407474059694200>'
                    }`;
                  })
                  .join('\n') || 'No messages yet.'
              )
              .setColor(Colors.Yellow);

            const logChannel = client.channels.cache.get(logChannelId);
            if (logChannel?.isTextBased()) {
              console.log('Sending logs to log channel');
              await logChannel.send({
                embeds:
                  currentNight === 1
                    ? [aliveDeadEmbed]
                    : [aliveDeadEmbed, messageEmbed]
              });
            }
          } catch (error) {
            console.error('Error sending logs:', error);
          }
        } else if (
          embed.footer?.text?.includes('Enjoyed') ||
          embed.title.includes('Game Over')
        ) {
          const messages = Messages.get(message.channel.id);
          const channel = message.channel;

          currentGame.night++;

          const currentNight = currentGame.night;
          const messageEmbed = new EmbedBuilder()
            .setTitle(`Night ${currentNight - 1} messages`)
            .setDescription(
              currentGame.players
                .filter((p) => p.alive)
                .map((p) => {
                  const messages = p.messages.get(currentNight - 1) || 0;
                  return `<:dot:931436867272998922> <@${
                    p.id
                  }> => ${messages}/3 ${
                    messages >= 3
                      ? '<:TickYes:962407492300705834>'
                      : '<:TickNo:962407474059694200>'
                  }`;
                })
                .join('\n') || 'No messages yet.'
            )
            .setColor(Colors.Yellow);

          if (logChannel?.isTextBased()) {
            await logChannel.send({
              embeds: [
                messageEmbed,
                new EmbedBuilder('Final Summary')
                  .setColor(Colors.Yellow)
                  .setDescription(
                    currentGame.players
                      .map((p) => {
                        const alive = p.alive
                          ? '<:Alive:1381160419426832425>'
                          : '<:Dead:1381160462384631931>';

                        const messages = p.messages.reduce(
                          (total, value) => total + value,
                          0
                        );

                        return `${alive} <@${p.id}> ${
                          p.alive ? '' : `Died N${p.deadAt}`
                        }\n<:dot:931436867272998922>Total messages: ${messages}`;
                      })
                      .join('\n')
                  )
              ]
            });

            await logChannel.send({
              embeds: [
                new EmbedBuilder().setTitle('Game over').setColor(Colors.Red)
              ]
            });

            Game.delete(message.channel.id);
            const transcriptBuffer =
              await discordTranscripts.generateFromMessages(messages, channel, {
                returnType: 'buffer'
              });
            const name = `mafia-${channel.id}-${Date.now()}`;
            const transcriptPath = path.join(
              os.homedir(),
              'transcripts',
              'public',
              `${name}.html`
            );

            fs.writeFileSync(transcriptPath, transcriptBuffer);

            logChannel.send(
              `Transcript: https://hrish.dev/transcripts/${name}`
            );
          }
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

        logChannel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle('New game')
              .setDescription(
                message.mentions.users.map((u) => `<@${u.id}>`).join('\n')
              )
              .setColor(Colors.Green)
          ]
        });
      }
    }
  }
};
