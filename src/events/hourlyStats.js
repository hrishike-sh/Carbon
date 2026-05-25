const { EmbedBuilder } = require('discord.js');
const config = require('../config');
const { Theme } = require('../utils/embeds');

function snapshot(client) {
  return {
    messagesRead: client.state.counts.messagesRead,
    commandsRan: client.state.counts.commandsRan,
    slashCommandsRan: client.state.counts.slashCommandsRan,
    coinEventsTriggered: client.state.counts.coinEventsTriggered,
    heistsTriggered: client.state.counts.heistsTriggered,
    mathEventsTriggered: client.state.counts.mathEventsTriggered
  };
}

module.exports = {
  name: 'hourlyStats',

  execute(client) {
    const channel = client.channels.cache.get(config.ids.channels.stats);
    if (!channel) return;

    let last = snapshot(client);

    setInterval(() => {
      try {
        const now = snapshot(client);
        const activeUsers = client.state.counts.activeUsers.size;

        const messagesRead = now.messagesRead - last.messagesRead;
        const prefixCmds = now.commandsRan - last.commandsRan;
        const slashCmds = now.slashCommandsRan - last.slashCommandsRan;
        const coinEvents = now.coinEventsTriggered - last.coinEventsTriggered;
        const heists = now.heistsTriggered - last.heistsTriggered;
        const mathEvents = now.mathEventsTriggered - last.mathEventsTriggered;
        const totalCmds = prefixCmds + slashCmds;

        const embed = new EmbedBuilder()
          .setTitle('Hourly Stats Report')
          .setColor(Theme.info)
          .setTimestamp()
          .addFields(
            {
              name: 'Messages',
              value: `${messagesRead.toLocaleString()}`,
              inline: true
            },
            {
              name: 'Active Users',
              value: `${activeUsers.toLocaleString()}`,
              inline: true
            },
            {
              name: 'Msg/User',
              value: activeUsers > 0
                ? (messagesRead / activeUsers).toFixed(1)
                : '0',
              inline: true
            },
            {
              name: 'Prefix Commands',
              value: `${prefixCmds.toLocaleString()}`,
              inline: true
            },
            {
              name: 'Slash Commands',
              value: `${slashCmds.toLocaleString()}`,
              inline: true
            },
            {
              name: 'Total Commands',
              value: `${totalCmds.toLocaleString()}`,
              inline: true
            },
            {
              name: 'Coin Events',
              value: `${coinEvents.toLocaleString()}`,
              inline: true
            },
            {
              name: 'Heists',
              value: `${heists.toLocaleString()}`,
              inline: true
            },
            {
              name: 'Math Events',
              value: `${mathEvents.toLocaleString()}`,
              inline: true
            }
          )
          .setFooter({ text: `All-time messages: ${now.messagesRead.toLocaleString()} | All-time commands: ${(now.commandsRan + now.slashCommandsRan).toLocaleString()}` });

        channel.send({ embeds: [embed] }).catch(() => {});

        last = now;
        client.state.counts.activeUsers.clear();
      } catch (err) {
        console.error('Hourly stats error:', err);
      }
    }, 1000 * 60 * 60);
  }
};
