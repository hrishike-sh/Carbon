const { Colors } = require('discord.js');
const config = require('../../config');
const { sleep } = require('../../utils/helpers');
const { parseTime } = require('../../utils/formatters');

const formatDiscordTime = (time, format) => {
  return `<t:${(time / 1000).toFixed(0)}:${format || 'R'}>`;
};

module.exports = {
  name: 'afk',

  async execute(message, client) {
    const afks = client.state.afks;

    if (client.state.afkIgnore.includes(message.channel.id)) return;

    if (afks.includes(message.author.id)) {
      const DATABASE = require('../../database/models/afk');
      const dUser = await DATABASE.findOne({ userId: message.author.id });

      const reply = await message.reply({
        embeds: [
          {
            title: 'Welcome back ' + message.author.tag,
            description: `You were pinged ${dUser?.dms?.length || 0} times, check your dms!`
          }
        ]
      });
      setTimeout(() => reply.delete().catch(() => {}), 2500);

      client.state.afks = client.state.afks.filter((a) => a !== message.author.id);
      await DATABASE.deleteOne({ userId: message.author.id });

      const pingList = (dUser?.dms || [])
        .map(
          (msg) =>
            `[${formatDiscordTime(msg.time, 't')}] **${msg.tag}**: ${msg.content} ${
              msg.link ? `[[Jump]](${msg.link})` : ''
            }`
        )
        .join('\n');

      try {
        const dm = await message.author.createDM();
        await dm.send({
          embeds: [
            {
              title: 'Your pings:',
              description: pingList || 'You have no friends LMAO',
              color: Colors.Green,
              timestamp: new Date()
            }
          ]
        });
      } catch {}
    }

    if (message.mentions.members.size > 0) {
      const DATABASE = require('../../database/models/afk');
      for (const [, mention] of message.mentions.members) {
        if (afks.includes(mention.user.id)) {
          const db = await DATABASE.findOne({ userId: mention.user.id });
          if (!db) continue;

          db.dms.push({
            time: message.createdTimestamp,
            content: message.content,
            tag: message.author.tag,
            link: message.url
          });
          await db.save();

          const reply = await message.reply({
            embeds: [
              {
                title: `${mention.user.tag} is AFK!`,
                color: Colors.Blurple,
                description: `Reason: ${db.reason}\nLast seen ${formatDiscordTime(db.time)}`,
                footer: {
                  text: "They will receive a DM about this when they're back!"
                }
              }
            ],
            allowedMentions: { users: [], roles: [] }
          });
          setTimeout(() => reply.delete().catch(() => {}), 10_000);
        }
      }
    }
  }
};
