const {
  Message,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle
} = require('discord.js');
const ms = require('pretty-ms');
module.exports = {
  name: 'fastclick',
  usage: '<USER>',
  description: 'Use your skills to win fights, the fastest to click wins!',
  /**
   * @param {Message} message
   */
  async execute(message, args) {
    const user1 = message.member;
    const user2 =
      message.mentions.members.first() ||
      message.guild.members.cache.get(args[0]);

    if (!user2)
      return message.channel.send(
        `You must mention someone to play with them!\n\nExample: \`fh fastclick @Hrishikesh#0369\``
      );

    let yesButton = new ButtonBuilder()
      .setStyle(ButtonStyle.Success)
      .setCustomId('yes_fc')
      .setLabel('Accept');
    let noButton = new ButtonBuilder()
      .setStyle(ButtonStyle.Danger)
      .setCustomId('no_fc')
      .setLabel('Decline');
    let row = new ActionRowBuilder().addComponents([noButton, yesButton]);
    const confirmation = await message.channel.send({
      embeds: [
        {
          title: 'Confirmation',
          description: `${user2}, ${user1} has challenged you for a game of fast click.\nWhat do you say?`,
          timestamp: new Date()
        }
      ],
      components: [row]
    });
    const confirmationCollector = confirmation.createMessageComponentCollector(
      (b) => b,
      {
        time: 30000
      }
    );

    confirmationCollector.on('collect', async (button) => {
      if (button.user.id !== user2.id) {
        return button.reply({
          content: 'This is not for you.',
          ephemeral: true
        });
      }

      if (button.customId === 'yes_fc') {
        button.deferUpdate();
        yesButton.setDisabled();
        noButton = noButton
          .setStyle(ButtonStyle.Secondary)
          .setCustomId('no_fc')
          .setDisabled();
        row = new ActionRowBuilder().addComponents([yesButton, noButton]);
        confirmation.edit({
          embeds: [
            {
              title: 'Challenge Accepted',
              description: `${user2}, ${user1} has challenged you for a game of fast click.\nWhat do you say?`,
              timestamp: new Date()
            }
          ],
          components: [row]
        });

        const mainMessage = await message.channel.send(
          `Alright! The button will appear in a few seconds, good luck!`
        );
        let mainButton = new ButtonBuilder()
          .setStyle(ButtonStyle.Success)
          .setLabel('This one')
          .setCustomId('correct-fc');
        let baitButton1 = new ButtonBuilder()
          .setStyle(ButtonStyle.Secondary)
          .setLabel('No not this')
          .setCustomId('wrong1-fc');
        let baitButton2 = new ButtonBuilder()
          .setStyle(ButtonStyle.Secondary)
          .setLabel('No not this')
          .setCustomId('wrong2-fc');
        let baitButton3 = new ButtonBuilder()
          .setStyle(ButtonStyle.Secondary)
          .setLabel('No not this')
          .setCustomId('wrong3-fc');
        let baitButton4 = new ButtonBuilder()
          .setStyle(ButtonStyle.Secondary)
          .setLabel('No not this')
          .setCustomId('wrong4-fc');
        let array = [
          mainButton,
          baitButton1,
          baitButton2,
          baitButton3,
          baitButton4
        ].sort(() => Math.random() - 0.5);
        let mainRow = new ActionRowBuilder().addComponents(array);
        await sleep(2500);
        mainMessage.edit({
          components: [mainRow],
          content: 'Click the green one!'
        });
        const now = new Date();

        const mainCollector = mainMessage.createMessageComponentCollector(
          (b) => b,
          {
            time: 30000
          }
        );
        mainCollector.on('collect', async (button) => {
          if (![user1.id, user2.id].includes(button.user.id)) {
            await button.reply({
              content: `This is not for you.`,
              ephemeral: true
            });
            return;
          }
          mainCollector.stop();

          if (button.customId !== 'correct-fc') {
            const loser = button.user.id;
            const winner = loser === user1.id ? user2.id : user1.id;
            mainButton.setDisabled();
            baitButton1.setDisabled();
            baitButton2.setDisabled();
            baitButton3.setDisabled();
            baitButton4.setDisabled();
            array = array;
            mainRow = new ActionRowBuilder().addComponents(array);
            button.deferUpdate();
            mainMessage.edit({
              components: [mainRow],
              content: `:trophy: <@${
                [user1.id, user2.id].filter((val) => val !== loser)[0]
              }> won because <@${loser}> clicked the wrong button!`
            });
            return;
          }

          if (![user1.id, user2.id].includes(button.user.id)) {
            await button.reply({
              content: 'This is not for you',
              ephemeral: true
            });
            return;
          }
          const clickedIn = ms(new Date() - now, {
            verbose: true
          });
          const winner = button.user.id;
          mainButton.setDisabled();
          baitButton1.setDisabled();
          baitButton2.setDisabled();
          baitButton3.setDisabled();
          baitButton4.setDisabled();
          array = array;
          mainRow = new ActionRowBuilder().addComponents(array);
          button.deferUpdate();
          mainMessage.edit({
            components: [mainRow],
            content: `:trophy: <@${winner}> has won! The button was clicked in ${clickedIn}!`
          });
          return;
        });
      } else {
        button.deferUpdate();
        yesButton = yesButton
          .setStyle(ButtonStyle.Success)
          .setCustomId('yes_fc')
          .setDisabled();
        noButton.setDisabled();
        row = new ActionRowBuilder().addComponents([yesButton, noButton]);
        confirmation.edit({
          embeds: [
            {
              title: 'Challenge Declined',
              description: `${user2}, ${user1} has challenged you for a game of fast click.\nWhat do you say?`,
              timestamp: new Date()
            }
          ],
          components: [row]
        });
        return;
      }
    });
  }
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
