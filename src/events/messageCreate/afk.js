const DATABASE = require('../../database/models/afk');
const { successEmbed, infoEmbed } = require('../../utils/embeds');
const MAX_STORED_PINGS = 100;

const formatDiscordTime = (time, format) => {
  return `<t:${Math.floor(time / 1000)}:${format || 'R'}>`;
};

module.exports = {
  name: 'afk',

  async execute(message, client) {
    const afks = client.state.afks;

    if (client.state.afkIgnore.includes(message.channel.id)) return;

    if (afks.includes(message.author.id)) {
      // Claim the AFK record atomically: two messages arriving together should
      // not both announce a return or send the same ping history.
      const dUser = await DATABASE.findOneAndDelete({ userId: message.author.id });
      client.state.afks = client.state.afks.filter((a) => a !== message.author.id);

      if (dUser) {
        const reply = await message.reply({
          embeds: [
            successEmbed({
              title: `Welcome back ${message.author.tag}`,
              description: `You have ${dUser.dms?.length || 0} recent pings, check your DMs!`
            })
          ]
        }).catch(() => null);
        if (reply) setTimeout(() => reply.delete().catch(() => {}), 2500).unref();

        const pingLines = (dUser.dms || []).slice(-MAX_STORED_PINGS)
          .map(
            (msg) =>
              `[${formatDiscordTime(msg.time, 't')}] **${msg.tag}**: ${String(msg.content || '').slice(0, 700)} ${
                msg.link ? `[[Jump]](${msg.link})` : ''
              }`
          );
        const pages = [];
        let page = '';
        for (const line of pingLines) {
          if (page.length + line.length + 1 > 3900) {
            pages.push(page);
            page = '';
          }
          page += `${line}\n`;
        }
        pages.push(page || 'You have no recorded pings.');

        try {
          const dm = await message.author.createDM();
          for (const description of pages) await dm.send({
            embeds: [
              successEmbed({
                title: 'Your recent pings:',
                description,
                timestamp: true
              })
            ]
          });
        } catch {}
      }
    }

    if (message.mentions.members?.size > 0) {
      for (const [, mention] of message.mentions.members) {
        if (client.state.afks.includes(mention.user.id)) {
          const db = await DATABASE.findOneAndUpdate(
            { userId: mention.user.id },
            { $push: { dms: { $each: [{
              time: message.createdTimestamp,
              content: message.content,
              tag: message.author.tag,
              link: message.url
            }], $slice: -MAX_STORED_PINGS } } },
            { new: true }
          );
          if (!db) continue;

          const reply = await message.reply({
            embeds: [
              infoEmbed({
                title: `${mention.user.tag} is AFK!`,
                description: `Reason: ${db.reason}\nLast seen ${formatDiscordTime(db.time)}`,
                footer: "They'll receive a DM about this when they're back!"
              })
            ],
            allowedMentions: { users: [], roles: [] }
          });
          setTimeout(() => reply.delete().catch(() => {}), 10_000).unref();
        }
      }
    }
  }
};
