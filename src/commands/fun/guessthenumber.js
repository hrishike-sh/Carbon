const {
  Message,
  MessageEmbed,
  Client,
  Colors,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

module.exports = {
  name: 'guessthenumber',
  aliases: ['gtn'],
  cooldown: 60,
  roles: ['858088054942203945', '824539655134773269', '824348974449819658'],
  /**
   *
   * @param {Message} message
   * @param {[String]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    if (!args) {
      return message.reply({
        embeds: [
          {
            color: 'Red',
            description:
              'Please provide an upper-limit for the GTN.\n\nExample: fh gtn 2500'
          }
        ]
      });
    }

    if (isNaN(Number(args[0]))) {
      return message.reply({
        content: 'Provide a valid number you moron.'
      });
    }

    const randomNumber = Math.floor(Math.random() * Number(args[0]));
    const startEmbed = await message.channel.send({
      embeds: [
        {
          title: 'Guess the Number!',
          description: `I have chosen a random number between 0-${args[0].toLocaleString()}!\n\nThe channel will unlock when ${message.author.toString()} clicks the button. Goodluck!`,
          color: Colors.Red
        }
      ],
      components: [
        new ActionRowBuilder().addComponents([
          new ButtonBuilder()
            .setLabel('Start')
            .setCustomId('start;gtn')
            .setStyle(ButtonStyle.Danger)
        ])
      ]
    });
    message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
      SendMessages: false
    });
    const collector = startEmbed.createMessageComponentCollector({
      time: 15_000
    });

    collector.on('collect', async (button) => {
      if (button.user.id !== message.author.id) {
        return button.reply({
          ephemeral: true,
          content: 'go away'
        });
      }
      button.reply({
        ephemeral: true,
        content: `Channel will be unlocked! The number is: ${randomNumber}`
      });
      collector.stop();

      message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
        SendMessages: true
      });
      const mainCollector = await message.channel.createMessageCollector();
      mainCollector.on('collect', async (msg) => {
        if (msg.content != randomNumber) return;

        message.channel.permissionOverwrites.edit(
          message.guild.roles.everyone,
          {
            SendMessages: false
          }
        );
        mainCollector.stop();
        return msg.reply({
          embeds: [
            {
              title: 'The number has been guessed! :tada:',
              description: `The number was ${randomNumber}, and it was guessed by ${msg.author.toString()}`,
              timestamp: new Date()
            }
          ]
        });
      });
    });

    collector.on('end', () => {
      startEmbed.edit({
        components: []
      });

      message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
        SendMessages: null
      });
    });
  }
};
