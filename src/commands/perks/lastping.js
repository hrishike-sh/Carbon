const {
  Message,
  Colors,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const Database = require('../../database/lastping');
module.exports = {
  name: 'lastping',
  aliases: ['lp'],
  /**
   *
   * @param {Message} message
   */
  async execute(message) {
    const allowedRoles = [
      '826002228828700718',
      '824539655134773269',
      '999911967319924817',
      '825283097830096908',
      '828048225096826890',
      '876460154705555487',
      '824687526396297226'
    ];
    if (!message.member.roles.cache.hasAny(...allowedRoles)) {
      return message
        .reply({
          embeds: [
            {
              color: Colors.Red,
              description: `You need to have any one of these roles to use this command:\n${allowedRoles
                .map((a) => `<@&${a}>`)
                .join(' ')}`
            }
          ]
        })
        .then(async (msg) => {
          await sleep(2500);
          msg?.delete();
        });
    }
    const userId = message.author.id;
    const user = await Database.findOne({ userId });
    const d = [];
    if (user?.pings) {
      for (let i = 0; i < user.pings.length; i++) {
        if (i > 9) break;
        const s =
          (
            await message.client.users
              .fetch(user.pings[i].pingerId)
              .catch(() => null)
          )?.tag || 'Unknown#0000';
        const cc =
          (user.pings[i].msg.content.length > 99
            ? user.pings[i].msg.content.slice(0, 100) + '...'
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
            footer: {
              text: 'Only 10 pings are stored.'
            }
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
          filter: (m) => m.user.id == message.author.id
        }).then((c) => {
          c.message.delete();
        });
      });
    if (user.pings.length > 10) {
      const newPings = user.pings.slice(0, 10);
      user.pings = newPings;
      user.save();
    }
  }
};
const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};
