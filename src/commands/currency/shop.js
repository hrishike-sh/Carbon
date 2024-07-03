const {
  Message,
  EmbedBuilder,
  StringSelectMenuOptionBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  Colors
} = require('discord.js');
const Database = require('../../database/coins');
const Teams = require('../../database/teams');
const SHOP = [
  // {
  //   name: 'Sabotage',
  //   price: 200_000,
  //   duration: Infinity,
  //   emoji: {
  //     str: '<:sabotage:1257584833333559359>',
  //     id: '1257584833333559359'
  //   },
  //   value: 'sabotage'
  // },
  {
    name: 'Point for Team',
    price: 125_000,
    duration: Infinity,
    emoji: {
      str: '<:plusone:1255581374661005363>',
      id: '1255581374661005363'
    },
    value: 'point'
  },
  // {
  //   name: 'Absolutely Nothing',
  //   price: 1000,
  //   duration: Infinity,
  //   emoji: {
  //     str: '<:shrug:1255590797416333364>',
  //     id: '1255590797416333364'
  //   },
  //   value: 'nothing'
  // },
  {
    name: 'Custom Channel [Soon]',
    price: 1e6,
    duration: 31,
    emoji: {
      str: '<:text_channel:1003342275037888522>',
      id: '1003342275037888522'
    },
    value: 'channel'
  },
  {
    name: 'Custom Role [Soon]',
    price: 1e6,
    duration: 31,
    emoji: {
      str: '<:role:1003345268751741099>',
      id: '1003345268751741099'
    },
    value: 'role'
  }
];
module.exports = {
  name: 'shop',
  /**
   *
   * @param {Message} message
   */
  async execute(message) {
    const embed = new EmbedBuilder()
      .setTitle('Shop | Opens Soon')
      .setFooter({
        text: 'Prices are placeholders and are subject to change.'
      })
      .setColor(Colors.Green)
      .addFields(
        SHOP.map((item) => ({
          name: `${item.emoji.str}${item.name}`,
          value: `<:blank:914473340129906708>**Price**: <:token:1003272629286883450> ${item.price.toLocaleString()}\n<:blank:914473340129906708>**Duration**: ${item.duration.toLocaleString()} Days`
        }))
      );
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('shop_shop')
      .setPlaceholder('Select an item')
      .addOptions(
        SHOP.map((item) => {
          return new StringSelectMenuOptionBuilder()
            .setLabel(item.name)
            .setValue(item.value)
            .setEmoji(item.emoji.str)
            .setDescription(`Price: ${item.price.toLocaleString()} coins.`);
        })
      )
      .setMaxValues(1)
      .setMinValues(1);
    const row = new ActionRowBuilder().addComponents(selectMenu);

    const msg = await message.reply({
      embeds: [embed],
      components: [row]
    });
    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      idle: 30_000,
      max: 1
    });
    collector.on('collect', async (interaction) => {
      const value = interaction.values[0];
      interaction.deferUpdate();

      if (value === 'nothing') {
        const DatabaseUser = await Database.findOne({
          userId: message.author.id
        });
        const item = SHOP.filter((a) => a.value == value)[0];
        if (item.price > DatabaseUser?.coins) {
          return msg.reply({
            content: `${message.author} you don't have enough coins.`
          });
        }
        DatabaseUser.coins -= item.price;
        await DatabaseUser.save();
        msg.reply({
          embeds: [
            {
              color: Colors.Green,
              description: `You have purchased **${
                item.name
              }**!\n\n- **${item.price.toLocaleString()}** coins\n+ **${
                item.name
              }**`
            }
          ]
        });
      } else if (value == 'point') {
        const TeamUser = await Teams.findOne({
          users: message.author.id
        });
        const DatabaseUser = await Database.findOne({
          userId: message.author.id
        });
        if (!TeamUser) {
          return msg.reply({
            embeds: [
              {
                description: "You're not in a team!",
                color: Colors.Red
              }
            ]
          });
        }

        const item = SHOP.filter((a) => a.value == value)[0];
        if (item.price > DatabaseUser?.coins) {
          return msg.reply({
            embeds: [
              {
                description: `You don't have ${item.price.toLocaleString()} coins.`,
                color: Colors.Red
              }
            ]
          });
        }
        DatabaseUser.coins -= item.price;
        await DatabaseUser.save();
        TeamUser.points++;
        await TeamUser.save();

        return msg.reply({
          embeds: [
            {
              title: 'Purchase Successful!',
              description: `You bought 1 point for your team **${TeamUser.name}**!\nYour team now has **${TeamUser.points}** points.`,
              color: Colors.Green,
              timestamp: new Date()
            }
          ]
        });
      } else if (value == 'sabotage') {
        const teamuser = await Teams.findOne({
          users: message.author.id
        });
        let dbuser = await Database.findOne({
          userId: message.author.id
        });
        if (!teamuser)
          return msg.reply({
            content: "You're not in a team!"
          });

        const item = SHOP.filter((a) => a.value == value)[0];
        const allTeams = await Teams.find({ points: { $gt: 0 } }).sort({
          points: -1
        });
        let emb;
        if (item.price > dbuser.coins) {
          return msg.reply({
            embeds: [
              {
                description: `You don't have ${item.price.toLocaleString()} coins.`,
                color: Colors.Red
              }
            ]
          });
        }
        const embed = new EmbedBuilder()
          .setTitle('<:sabotage:1257584833333559359> Sabotage')
          .setDescription(`Select the team you want to sabotage...`)
          .setFooter({
            text: "You don't have to do this."
          })
          .setColor(Colors.Red);

        const selectMenu = new StringSelectMenuBuilder()
          .setCustomId('sabotage_menu')
          .setMaxValues(1)
          .setPlaceholder('Select team...');
        allTeams.forEach((team) => {
          selectMenu.addOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel(team.name)
              .setDescription(`Points: ${team.points}`)
              .setValue(team._id.toString())
          );
        });

        const row = new ActionRowBuilder().addComponents(selectMenu);

        emb = await msg.reply({
          embeds: [embed],
          components: [row]
        });
        const col = emb.createMessageComponentCollector({
          filter: (i) => i.user.id === message.author.id,
          idle: 5_000,
          max: 2
        });
        let sabotaged = false;
        col.on('collect', async (i) => {
          if (sabotaged) return;
          const team = await Teams.findOne({ _id: i.values[0] });
          if (!team) return;
          team.points--;
          await team.save();
          dbuser.coins -= item.price;
          await dbuser.save();
          sabotaged = true;
          msg.reply({
            content: `Sabotaged ${team.name}! They now have ${team.points} points!`
          });
          col.stop();
        });
        col.on('end', (collected) => {
          row.components[0].setDisabled(true);
          emb.edit({
            components: [row]
          });
          if (!sabotaged)
            msg.reply({
              content: '5 second limit exceeded. Try again!'
            });
        });
      }
    });

    collector.on('end', (collected) => {
      row.components[0].setDisabled(true);
      msg.edit({ components: [row] });
    });
  }
};
