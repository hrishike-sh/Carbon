const {
  Message,
  Client,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Colors
} = require('discord.js');

module.exports = {
  name: 'battleroyale',
  aliases: ['br'],
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    if (message.author.id !== '598918643727990784') return;

    const conf_embed = new EmbedBuilder()
      .setTitle('Battle Royale')
      .setDescription('Click the `JOIN` button to join!\n\nMax Players: 25')
      .setFooter({
        text: 'Game starts in 10 seconds.'
      })
      .setColor(Colors.Gold);
    const conf_row = new ActionRowBuilder().addComponents([
      new ButtonBuilder()
        .setLabel('JOIN')
        .setStyle(ButtonStyle.Success)
        .setCustomId('br_join')
    ]);
    const joinMessage = await message.channel.send({
      embeds: [conf_embed],
      components: [conf_row]
    });
    const data = {
      joined: []
    };
    const joinCollector = joinMessage.createMessageComponentCollector({
      filter: (m) => {
        if (data.joined.map((a) => a.id).includes(m.user.id)) {
          m.reply({
            ephemeral: true,
            content: 'You have already joined the game.'
          });
          return false;
        } else return true;
      },
      time: 10 * 1000
    });

    joinCollector.on('collect', async (m) => {
      if (data.joined.length > 24) {
        joinCollector.stop();
        return;
      }
      data.joined.push({
        id: m.user.id,
        name: m.user.tag,
        health: 100
      });
      await m.reply({
        ephemeral: true,
        content: 'You have joined the game.'
      });
    });
    joinCollector.on('end', async () => {
      if (data.joined.length < 3) {
        return message.reply('You need atleast 4 players to play.');
      }
      const embedData = breakArray(data.joined);
      const mainRow = [new ActionRowBuilder()];
      for (let i = 1; i < Math.ceil(data.joined.length / 5); i++) {
        mainRow.push(new ActionRowBuilder());
      }
      for (let i = 0; i < data.joined.length; i++) {
        if (i < 5) {
          mainRow[0].addComponents(
            new ButtonBuilder()
              .setLabel(`${data.joined[i].name} (100)`)
              .setStyle(ButtonStyle.Secondary)
              .setCustomId(`br_${data.joined[i].id}_1`)
              .setDisabled()
          );
        } else if (i < 10) {
          mainRow[1].addComponents(
            new ButtonBuilder()
              .setLabel(`${data.joined[i].name} (100)`)
              .setStyle(ButtonStyle.Secondary)
              .setCustomId(`br_${data.joined[i].id}_2`)
              .setDisabled()
          );
        } else if (i < 15) {
          mainRow[2].addComponents(
            new ButtonBuilder()
              .setLabel(`${data.joined[i].name} (100)`)
              .setStyle(ButtonStyle.Secondary)
              .setCustomId(`br_${data.joined[i].id}_3`)
              .setDisabled()
          );
        } else if (i < 20) {
          mainRow[3].addComponents(
            new ButtonBuilder()
              .setLabel(`${data.joined[i].name} (100)`)
              .setStyle(ButtonStyle.Secondary)
              .setCustomId(`br_${data.joined[i].id}_4`)
              .setDisabled()
          );
        } else {
          mainRow[4].addComponents(
            new ButtonBuilder()
              .setLabel(`${data.joined[i].name} (100)`)
              .setStyle(ButtonStyle.Secondary)
              .setCustomId(`br_${data.joined[i].id}_5`)
              .setDisabled()
          );
        }
      }
      const game_embed = new EmbedBuilder()
        .setTitle('Battle Royale')
        .setColor(Colors.Gold)
        .setFooter({
          text: 'Last man standing wins!'
        })
        .setDescription(
          `The game starts in **5 seconds**. Click on the button to attack that particular user.\n\nYour goal is to damage others and be the last one standing, good luck!`
        );
      const gameMessage = await message.channel.send({
        components: mainRow,
        embeds: [game_embed]
      });
      await sleep(5000);
      mainRow.forEach((c) => {
        c.components.forEach((r) => {
          r.setDisabled(false).setStyle(ButtonStyle.Primary);
        });
      });

      const mainCollector = (
        await gameMessage.edit({ components: mainRow })
      ).createMessageComponentCollector({
        filter: (m) => {
          if (!data.joined.map((a) => a.id).includes(m.user.id)) {
            m.reply({
              ephemeral: true,
              content: "You're not in this game!"
            });
            return false;
          }
          if (data.joined.find((a) => a.id == m.user.id).health < 1) {
            m.reply({
              ephemeral: true,
              content: "You're already dead!"
            });
            return false;
          }
          return true;
        }
      });

      mainCollector.on('collect', async (m) => {
        const victim = data.joined.find(
          (a) => a.id == m.customId.split('_')[1]
        );
        if (victim.id == m.user.id) {
          m.reply({
            ephemeral: true,
            content: "You can't attack yourself!"
          });
          return;
        }

        const dmg = Math.ceil(Math.random() * 10) + 5;
        victim.health -= dmg;
        const vBut = mainRow[
          Number(m.customId.split('_')[2]) - 1
        ].components.find((a) => a.data.custom_id.includes(victim.id));
        if (victim.health < 1) {
          victim.health = 0;
          vBut.setDisabled().setEmoji('☠').setStyle(ButtonStyle.Secondary);
        }
        vBut.setLabel(`${victim.name} (${victim.health})`);
        m.reply({
          ephemeral: true,
          content: `You attacked ${victim.name} and dealt ${dmg} damage!`
        });
        updateMessage(gameMessage, mainRow);
      });
    });
  }
};
const breakArray = (array) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += 5) {
    chunks.push(array.slice(i, i + 5));
  }
  return chunks;
};

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
let LASTUPDATE = new Date().getTime();
function updateMessage(msg, components) {
  if (LASTUPDATE + 5000 < new Date().getTime()) {
    LASTUPDATE = new Date().getTime();
    msg.edit({ components });
  }
}