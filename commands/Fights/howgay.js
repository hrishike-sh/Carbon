const {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  Message,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  name: "howgay",
  category: "Fights",
  args: true,
  usage: "<user> <high / low>",
  description: "Dank Memer's howgay fighthub method, but its automatic!",
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    const target = message.mentions?.users?.first() || null;

    if (!target)
      return message.channel.send("You must ping someone to play with them!");

    let gamedata = {
      players: {
        one: message.member,
        two: message.mentions.members.first(),
        oneR: getRate(),
        twoR: getRate(),
      },
    };
    args.shift();

    const type = args[0]?.toLocaleLowerCase() || null;

    if (!type || !["low", "high", "l", "h"].includes(type)) {
      return message.reply(
        `You must specify the type of fight! Either HIGH or LOW (high/low/h/l).`
      );
    }

    gamedata.type = type.includes("h") ? "high" : "low";

    const confirmationMessage = await message.channel.send({
      content: `${target.toString()} do you want to play a game of HowGay with ${message.author.toString()}?`,
      embeds: [
        {
          title: `Confirmation | ${target.username}`,
          description:
            "Use the button to make your choice.\nYou have 30 seconds...",
          color: `Yellow`,
        },
      ],
      components: [
        new MessageActionRow().addComponents([
          new MessageButton()
            .setLabel("Accept")
            .setSyle(ButtonStyle.Success)
            .setCustomId("accept-hg"),
          new MessageButton()
            .setLabel("Deny")
            .setSyle(ButtonStyle.Danger)
            .setCustomId("deny-hg"),
        ]),
      ],
    });

    const collector = confirmationMessage.createMessageComponentCollector({
      time: 30 * 1000,
    });

    collector.on("collect", async (button) => {
      if (button.user.id !== target.user.id) {
        return button.reply({
          content: ":warning: This is not for you idiot.",
          ephemeral: true,
        });
      }

      if (button.customId.includes("accept")) {
        confirmationMessage.edit({
          embeds: [null],
          content: "This request was ACCEPTED.",
          components: [null],
        });

        const mainMessage = await message.channel.send({
          embeds: [
            {
              title: "Starting game....",
              color: "Green",
            },
          ],
        });

        await sleep(5000)

        const embed = new EmbedBuilder()
          .setTitle(`Howgay | ${target.user.tag} VS ${message.author.tag}`)
          .setDescription(
            `The one with the ${
              gamedata.type == "high" ? "**highest**" : "**lowest**"
            } rate wins!`
          )
          .addFields({
            name: `${gamedata.players.one.tag}`, value: `Rate: ${gamedata.players.oneR}`, inline: true
          }, {
            name: `${gamedata.players.two.tag}`, value: `Rate: ${gamedata.players.twoR}`, inline: true
          }).setTimestamp();

          mainMessage.edit({
            embeds: [embed],
            content: '_ _'
          })

          let winner = null;

          if(gamedata.type == 'high') {
            if(gamedata.players.oneR > gamedata.players.twoR){
                winner = gamedata.players.one
            } else if (gamedata.players.oneR < gamedata.players.twoR) {
                winner = gamedata.players.two
            } else {
                winner = null
            }
          } else {
            if(gamedata.players.oneR < gamedata.players.twoR){
                winner = gamedata.players.one
            } else if (gamedata.players.oneR > gamedata.players.twoR) {
                winner = gamedata.players.two
            } else {
                winner = null
            }
          }

          return message.channel.send(`:trophy: | ${winner ? winner.toString() : "Noone"} won the game!`)

      } else {
        confirmationMessage.edit({
          embeds: [null],
          content: "This request was DENIED.",
          components: [null],
        });
        return;
      }
    });
  },
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRate() {
  return Math.floor(Math.random() * 100);
}

/**
 */
//stfu
