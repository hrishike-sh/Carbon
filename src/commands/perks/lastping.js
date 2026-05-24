const {
  Colors,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const Database = require('../../database/models/lastping');
const config = require('../../config');
const { sleep } = require('../../utils/helpers');

module.exports = {
  name: 'lastping',
  aliases: ['lp'],

  async execute(message) {
    const allowedRoles = config.roles.lastPingAllowed;
    if (!message.member.roles.cache.hasAny(...allowedRoles)) {
      return message
        .reply({
          embeds: [
            {
              color: Colors.Red,
              description: `You need to have any one of these roles to use this command:\n${allowedRoles.map((a) => `<@&${a}>`).join(' ')}`
            }
          ]
        })
        .then(async (msg) => {
          await sleep(2500);
          msg?.delete().catch(() => {});
        });
    }

    if (message.channel.id === '870240187198885888') {
      return message.reply("You can't run this command here");
    }

    const userId = message.author.id;
    const user = await Database.findOne({ userId });
    const d = [];
    if (user?.pings?.length) {
      user.pings = user.pings.sort((a, b) => b.msg.when - a.msg.when);
      for (let i = 0; i < user.pings.length; i++) {
        if (i > 9) break;
        const s =
          (await message.client.users.fetch(user.pings[i].pingerId).catch(() => null))?.tag ||
          'Unknown#0000';
        const cc =
          (user.pings[i].msg.content.length > 99
            ? user.pings[i].msg.content.slice(0, 200) + '...'
            : user.pings[i].msg.content) +
          ` [[Jump]](${user.pings[i].msg.url})`;

        d.push(`<t:${user.pings[i].msg.when}:t> **@${s}**: ${cc}`);
      }
    } else {
      d.push('You have no recent pings.');
    }

    message
      .reply({
        embeds: [
          {
            title: 'Last Pings',
            color: Colors.Aqua,
            description:
              d.length > 1
                ? d.join(
                    '\n<:yes:931435927061020712><:yes:931435927061020712><:yes:931435927061020712><:yes:931435927061020712><:yes:931435927061020712>\n'
                  )
                : d[0],
            footer: { text: `Showing ${Math.min(10, user?.pings?.length || 0)}/${user?.pings?.length || 0}.` }
          }
        ],
        components: [
          new ActionRowBuilder().addComponents([
            new ButtonBuilder()
              .setCustomId('delete')
              .setEmoji('🗑')
              .setStyle(ButtonStyle.Primary)
          ])
        ]
      })
      .then((p) => {
        p.awaitMessageComponent({
          filter: (m) => m.user.id === message.author.id
        }).then(async (c) => {
          user.pings = [];
          await user.save();
          await c.message.edit({
            embeds: [
              {
                title: 'Last Pings',
                color: Colors.Aqua,
                description: 'Your pings have been cleared!',
                footer: { text: 'Only 10 pings are stored.' }
              }
            ],
            components: []
          });
        });
      });

    if (user?.pings?.length > 10) {
      user.pings = user.pings.slice(0, 10);
      await user.save();
    }
  }
};
