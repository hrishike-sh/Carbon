const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const config = require('../../config');
const { sleep, breakArray } = require('../../utils/helpers');
const { Theme } = require('../../utils/embeds');
const { onAsync } = require('../../utils/asyncEvents');

const randomActions = [
  '**{user}** absolutely DESTROYED **{target}**!',
  '**{target}** tried to run away from **{user}** but failed and DIED.',
  '**{user}** used a dagger to kill **{target}**!',
  '**{target}** was no match for **{user}**\'s dagger and DIED.',
  '**{user}** sneakily stabbed **{target}** to death.',
  '**{target}** tried to dodge, but **{user}** was too quick and plunged their dagger into their heart.',
  '**{user}** quickly disarmed **{target}**, then struck them with a fatal blow.',
  '**{target}** tried to defend, but **{user}** was too quick and managed to evade their defense.',
  '**{user}**\'s dagger was too quick for **{target}**, and they fell to the ground, defeated.',
  '**{target}** tried to counterattack, but **{user}**\'s dagger was too fast and they fell to the ground, defeated.'
];

const lastUpdates = new WeakMap();
function updateMessage(msg, components, emb) {
  if ((lastUpdates.get(msg) || 0) + 1000 < Date.now()) {
    lastUpdates.set(msg, Date.now());
    msg.edit({ components, embeds: [emb] }).catch(() => {});
  }
}

module.exports = {
  name: 'battleroyale',
  aliases: ['br'],

  async execute(message, args, client) {
    if (!message.member.roles.cache.has(config.roles.giveawayManager)) return;

    const conf_embed = new EmbedBuilder()
      .setTitle('Battle Royale')
      .setDescription('Click the `JOIN` button to join!\n\nMax Players: 25')
      .setFooter({ text: 'Game starts in 10 seconds.' })
      .setColor(Theme.warning);
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
    const data = { joined: [] };
    const joinCollector = joinMessage.createMessageComponentCollector({
      filter: (m) => {
        if (data.joined.map((a) => a.id).includes(m.user.id)) {
          m.reply({ flags: 64, content: 'You have already joined the game.' }).catch(() => {});
          return false;
        }
        return true;
      },
      time: 10 * 1000
    });

    onAsync(joinCollector, 'collect', async (m) => {
      if (data.joined.some((player) => player.id === m.user.id)) {
        return m.reply({ flags: 64, content: 'You have already joined the game.' });
      }
      if (data.joined.length > 24) {
        joinCollector.stop();
        return;
      }
      data.joined.push({ id: m.user.id, name: m.user.tag, health: 100, weapon: false });
      await m.reply({ flags: 64, content: 'You have joined the game.' });
    });

    onAsync(joinCollector, 'end', async () => {
      await joinMessage.edit({ components: [] });
      if (data.joined.length < 3) {
        return message.reply('You need atleast 3 players to play.');
      }
      const mainRow = [];
      for (let i = 0; i < Math.ceil(data.joined.length / 5); i++) {
        mainRow.push(new ActionRowBuilder());
      }

      const upgradesEmbed = new EmbedBuilder()
        .setTitle('Select your upgrades!')
        .setColor(Theme.success)
        .setFooter({ text: 'Game starts in 5 seconds.' })
        .setDescription(
          `<:dot:${config.ids.emojis.dot}> Players: ${data.joined
            .map((a) => `<@${a.id}>`)
            .join(' ')}\n\n<:yes:931435927061020712> **Weapon**: __+10__ Attack Damage\n<:yes:931435927061020712> **Shield**: __+50__ Health`
        );
      const upgradesRow = new ActionRowBuilder().addComponents([
        new ButtonBuilder().setLabel('Weapon').setStyle(ButtonStyle.Success).setEmoji('🗡').setCustomId('br_up_wp'),
        new ButtonBuilder().setLabel('Shield').setStyle(ButtonStyle.Success).setEmoji('🛡').setCustomId('br_up_sh')
      ]);
      const upgradesMessage = await message.channel.send({
        embeds: [upgradesEmbed],
        components: [upgradesRow]
      });

      const upgradeCollector = upgradesMessage.createMessageComponentCollector({
        filter: (m) => {
          if (!data.joined.map((a) => a.id).includes(m.user.id)) {
            m.reply({ flags: 64, content: "You're not in this game!" }).catch(() => {});
            return false;
          }
          const player = data.joined.find((a) => a.id === m.user.id);
          if (player.weapon || player.health > 100) {
            m.reply({ flags: 64, content: "You can't upgrade more than once!" }).catch(() => {});
            return false;
          }
          return true;
        },
        time: 5_000
      });

      onAsync(upgradeCollector, 'collect', async (button) => {
        const player = data.joined.find((a) => a.id === button.user.id);
        if (button.customId.includes('sh')) {
          if (player.health > 100 || player.weapon) {
            await button.reply({ flags: 64, content: 'You have already upgraded your shield or weapon!' });
            return;
          }
          player.health += 50;
          await button.reply({ flags: 64, content: 'You have upgraded your shield! You now have **150** Health!' });
        } else {
          if (player.health > 100 || player.weapon) {
            await button.reply({ flags: 64, content: 'You have already upgraded your shield or weapon!' });
            return;
          }
          player.weapon = true;
          await button.reply({ flags: 64, content: 'You have upgraded your weapon! You now deal **+10** damage!' });
        }
      });

      onAsync(upgradeCollector, 'end', async () => {
        upgradesRow.components.forEach((a) => a.setDisabled());
        await upgradesMessage.edit({ components: [upgradesRow] });

        for (let i = 0; i < data.joined.length; i++) {
          const player = data.joined[i];
          const rowIdx = Math.floor(i / 5);
          const but = new ButtonBuilder()
            .setLabel(`${player.name} (${player.health})`)
            .setStyle(ButtonStyle.Secondary)
            .setCustomId(`br_${player.id}_${rowIdx + 1}`)
            .setDisabled();
          if (player.weapon) but.setEmoji('🗡');
          else if (player.health > 100) but.setEmoji('🛡');
          mainRow[rowIdx].addComponents(but);
        }

        const game_embed = new EmbedBuilder()
          .setTitle('Battle Royale')
          .setColor(Theme.warning)
          .setFooter({ text: 'Last man standing wins!' })
          .setDescription(
            'The game starts in **5 seconds**. Click on the button to attack that particular user.\n\nYour goal is to damage others and be the last one standing, good luck!'
          );
        const description = [];
        const gameMessage = await message.channel.send({
          components: mainRow,
          embeds: [game_embed]
        });

        await sleep(5000);
        mainRow.forEach((c) => {
          c.components.forEach((r) => r.setDisabled(false).setStyle(ButtonStyle.Primary));
        });

        const mainCollector = (
          await gameMessage.edit({ components: mainRow })
        ).createMessageComponentCollector({
          filter: (m) => {
            if (!data.joined.map((a) => a.id).includes(m.user.id)) {
              m.reply({ flags: 64, content: "You're not in this game!" }).catch(() => {});
              return false;
            }
            if (data.joined.find((a) => a.id === m.user.id).health < 1) {
              m.reply({ flags: 64, content: "You're already dead!" }).catch(() => {});
              return false;
            }
            return true;
          },
          time: 15 * 60 * 1000
        });

        onAsync(mainCollector, 'collect', async (m) => {
          if (mainCollector.ended) return m.deferUpdate();
          const actor = data.joined.find((player) => player.id === m.user.id);
          if (!actor || actor.health <= 0) {
            return m.reply({ flags: 64, content: 'You are not an active player in this game.' });
          }
          const victim = data.joined.find((a) => a.id === m.customId.split('_')[1]);
          if (!victim || victim.health <= 0) {
            await m.reply({ flags: 64, content: 'That player has already been eliminated.' });
            return;
          }
          if (victim.id === m.user.id) {
            return m.reply({ flags: 64, content: "You can't attack yourself!" });
          }

          let dmg = Math.ceil(Math.random() * 10) + 5;
          if (actor.weapon) dmg += 10;
          victim.health -= dmg;

          const rowIdx = Number(m.customId.split('_')[2]) - 1;
          const vBut = mainRow[rowIdx].components.find((a) => a.data.custom_id.includes(victim.id));
          if (victim.health < 1) {
            victim.health = 0;
            description.push(
              randomActions[Math.floor(Math.random() * randomActions.length)]
                .replace('{user}', m.user.username)
                .replace('{target}', victim.name)
            );
            vBut.setDisabled().setEmoji('☠').setStyle(ButtonStyle.Secondary);
          }
          vBut.setLabel(`${victim.name} (${victim.health})`);
          const survivors = data.joined.filter((player) => player.health > 0);
          if (survivors.length === 1) {
            mainCollector.stop('winner');
            game_embed.setDescription(`<@${survivors[0].id}> has won the Battle Royale!`);
            await m.deferUpdate().catch(() => {});
            await gameMessage.edit({ embeds: [game_embed], components: [] });
            return;
          }
          await m.deferUpdate();
          if (mainCollector.ended) return;

          const shuffledRows = mainRow
            .map((a) => ({ sort: Math.random(), value: a }))
            .sort((a, b) => a.sort - b.sort)
            .map((a) => a.value);
          shuffledRows.forEach((com) => {
            com.components = com.components
              .map((a) => ({ sort: Math.random(), value: a }))
              .sort((a, b) => a.sort - b.sort)
              .map((a) => a.value);
          });

          game_embed.setDescription(description.map((a) => `- ${a}`).join('\n') || 'The battle is underway!');
          updateMessage(gameMessage, shuffledRows, game_embed);
        });
        mainCollector.on('end', (_, reason) => {
          if (reason === 'winner') return;
          gameMessage.edit({ components: [], content: 'The Battle Royale has ended.' }).catch(() => {});
        });
      });
    });
  }
};
