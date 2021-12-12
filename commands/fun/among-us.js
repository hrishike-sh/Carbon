const { Client, Message, MessageEmbed } = require("discord.js");
const { MessageButton, MessageActionRow } = require("discord-buttons");
module.exports = {
  name: "amongus",
  aliases: ["amogus"],
  fhOnly: false,
  disabledChannels: [],
  /** 
   * @param {Client} client
   * @param {Message} message
   * @param {String[]} args
   */
  async execute(message, args, client) {

    if (!message.member.permissions.has("MANAGE_GUILD")) {
      return message.reply("You need the \`MANAGE_GUILD\` permission to run this command.")
    }

    const emojiArray = [
      "917726679214985246",
      "917726744457383936",
      "917726831485026314",
      "917726919062077490",
      "917726981964058624",
      "917727061651640350",
      "917727115183530044",
      "917727205453365278",
      "917727491660083220",
      "917727535704457237",
    ];

    const joinBut = new MessageButton()
      .setLabel("Join")
      .setID("join-amongus")
      .setStyle("green");
    const infoBut = new MessageButton()
      .setLabel("Info")
      .setID("info-amongus")
      .setStyle("grey");
    const row = new MessageActionRow().addComponents([joinBut, infoBut]);

    const takePlayers = await message.channel.send({
      embed: new MessageEmbed()
        .setTitle("Among Us")
        .setDescription(
          "The game will begin in **30 seconds**\nOnly the first 10 people will be counted in!"
        ),
      components: [row],
    });

    const takePlayersCollector = takePlayers.createButtonCollector((b) => b, {
      time: 30 * 1000,
    });

    const joined = [];
    let gamedata = [];

    takePlayersCollector.on("collect", (button) => {
      if (joined.includes(button.clicker.user.id)) {
        button.reply.send("You have already joined.", true);
        return;
      }
      if (joined.length && joined.length > 10) {
        button.reply.send("The game is already full, too late.", true);
        return;
      }
      joined.push(button.clicker.user.id);
      gamedata.push({
        member: button.clicker.member,
        color: emojiArray[joined.length - 1],
        dead: false,
        impostor: false,
        id: `${emojiArray[joined.length - 1]}_${Math.floor(Math.random() * 1_000_000)}`,
        gotVoted: 0,
        messages: 0,
      });
      button.reply.send(
        `You have successfully joined the game and you are: ${client.emojis.cache
          .get(emojiArray[joined.length - 1])
          .toString()}`,
        true
      );
    });

    takePlayersCollector.on("end", async (collected) => {

      const randomNumber = Math.floor(Math.random() * gamedata.length);
      gamedata[randomNumber].impostor = true;
      const whoAmI = new MessageButton()
        .setLabel("Click me!")
        .setStyle("green")
        .setID("whoami-amogus")
      const roleCollector = await message.channel.send("Click the button to check your role, the game will start in **10 seconds**...", {
        component: whoAmI
      });

      const whoAmICollector = roleCollector.createButtonCollector(
        b => b,
        {
          time: 10000
        }
      )

      whoAmICollector.on("collect", async bbutton => {
        if (!joined.includes(bbutton.clicker.user.id)) {
          return bbutton.reply.send("You're not even in the game.", true)
        }

        const susUser = gamedata.filter(u => u.member.id === bbutton.clicker.user.id)[0]

        bbutton.reply.send(`You are **${susUser.impostor ? "the Impostor." : "a Crewmate"}**`, true)
      })


      await sleep(10 * 1000)

      let row1 = new MessageActionRow();
      let row2 = new MessageActionRow();
      let m;
      for (m = 0; m < gamedata.length; m++) {
        if (m < 5) {
          row1 = row1.addComponent(
            new MessageButton()
              .setLabel(gamedata[m].member.user.username)
              .setStyle("grey")
              .setID(gamedata[m].id)
              .setEmoji(gamedata[m].color)
              .setDisabled()
          );
        } else {
          row2 = row2.addComponent(
            new MessageButton()
              .setLabel(gamedata[m].member.user.username)
              .setStyle("grey")
              .setID(gamedata[m].id)
              .setEmoji(gamedata[m].color)
              .setDisabled()
          );
        }
      }

      let components = gamedata.length < 6 ? [row1] : [row1, row2];

      await message.channel.send(
        "**How does the impostor win?**\n> The impostor has to send **15** messages in order to win or they have to not get caught for 2 minutes.\n\n**How do the crewmates win?**\n> The crewmates will have to work together to find out who the impostor is!\n\n**How do I call an emergency meeting?**\n> Type `emergency` to call a meeting. **NOTE** Only 3 meetings are allowed each game.",
        {
          components,
        }
      );

      const mainCol = message.channel.createMessageCollector(
        (m) => joined.includes(m.author.id),
        {}
      );
      let impostorMessages = 0;
      let meetings = 3;
      let inMeeting = false;
      mainCol.on("collect", async (msg) => {
        const user = gamedata.filter(
          (value) => value.member.id === msg.author.id
        )[0];
        user.messages++;
        if (user.impostor && !inMeeting) {
          impostorMessages++;
        }

        if (user.impostor && impostorMessages > 15) {
          mainCol.stop("impostor");

          return message.channel.send(
            `After baiting a lot, and managing to not get caught, ${user.member} managed to send more than 15 messages...\n\nAll of the crewmates get killed and the ultimate winner is the impostor, which is ${user.member}!`
          );
        }

        if (msg.content.toLowerCase() === "emergency" && !inMeeting) {
          meetings--;
          if (meetings < 0) {
            message.channel.send(
              `The game has ended. After repeatedly using the Emergency button... it broke.\n\nResulting in the impostor killing everyone! The winner is ${gamedata.filter((u) => u.impostor)[0].member
              }`
            );
            mainCol.stop();
            return;
          }
          inMeeting = true;
          const row3 = new MessageActionRow().addComponent(
            new MessageButton()
              .setStyle("blurple")
              .setLabel("Messages")
              .setEmoji("📖")
              .setID("message-am")
          );
          row1 = new MessageActionRow();
          row2 = new MessageActionRow();

          for (let a = 0; a < gamedata.length; a++) {
            if (a < 5) {
              if (gamedata[a].dead) {
                row1 = row1.addComponent(
                  new MessageButton()
                    .setLabel(gamedata[a].member.user.username)
                    .setStyle("red")
                    .setID(gamedata[a].id)
                    .setEmoji(gamedata[a].color)
                    .setDisabled()
                );
              } else {
                row1 = row1.addComponent(
                  new MessageButton()
                    .setLabel(gamedata[a].member.user.username)
                    .setStyle("grey")
                    .setID(gamedata[a].id)
                    .setEmoji(gamedata[a].color)
                );
              }
            } else {
              if (gamedata[a].dead) {
                row2 = row2.addComponent(
                  new MessageButton()
                    .setLabel(gamedata[a].member.user.username)
                    .setStyle("red")
                    .setID(gamedata[a].id)
                    .setEmoji(gamedata[a].color)
                    .setDisabled()
                );
              } else {
                row2 = row2.addComponent(
                  new MessageButton()
                    .setLabel(gamedata[a].member.user.username)
                    .setStyle("grey")
                    .setID(gamedata[a].id)
                    .setEmoji(gamedata[a].color)
                );
              }
            }
          }
          components = m < 6 ? [row1, row3] : [row1, row2, row3];

          const meetingMessage = await message.channel.send(
            `${gamedata
              .map((m) => m.member)
              .join(
                " "
              )}\n\n**__EMERGENCY MEETING__**\nThe impostor's messages __won't__ be counted while the meeting is going on.\n\nYou have 15 seconds to vote someone out, good luck.`,
            {
              components,
            }
          );
          const meetingMessageContent = meetingMessage.content;
          const voteCollector = meetingMessage.createButtonCollector((b) => b, {
            time: 15000,
          });
          let voted = [];
          voteCollector.on("collect", async (button) => {
            if (button.id === "message-am") {
              const map = gamedata
                .sort((a, b) => b.messages - a.messages)
                .map(
                  (value, i) =>
                    `**${i + 1}**. ${value.member.user.tag} with ${value.messages
                    } messages.`
                )
                .join("\n");

              button.reply.send(`**Most Messages**\n\n${map}`, true);
            }
            if (!joined.includes(button.clicker.user.id)) {
              button.reply.send(
                "You are not even in the game, wtf are you trying to do??",
                true
              );
              return;
            }
            const voter = gamedata.filter(
              (u) => u.member.id === button.clicker.id
            )[0];
            if (voter.dead) {
              button.reply.send("You're already dead, why're you voting?", true);
              return;
            }
            const buttonId = button.id;

            if (voted.includes(button.clicker.user.id)) {
              button.reply.send("You have already voted.", true);
              return;
            }

            const votedTo = gamedata.filter((user) => user.id === buttonId)[0];
            button.reply.send(`You voted for ${votedTo.member}.`, true);
            votedTo.gotVoted++;

            voted.push(button.clicker.user.id);

            meetingMessage.edit(
              `${meetingMessageContent}\n\nVoted: ${voted
                .map((u) => `<@${u}>`)
                .join(" ")}`
            );
          });

          voteCollector.on("end", async () => {
            inMeeting = false;

            const mm = await message.channel.send(
              "The voting has ended and..."
            );
            await sleep(1000);

            const votedOut = gamedata.sort(
              (a, b) => b.gotVoted - a.gotVoted
            )[0];
            votedOut.dead = true;

            if (votedOut.impostor) {
              message.channel.send(
                `${votedOut.member} was voted out. And they were the impostor.\n\nCongrats to all the crewmates that survived!`
              );
              mainCol.stop();
            } else {
              message.channel.send(
                `${votedOut.member} was voted out. And they were not the impostor.`
              );
            }

            for (let amogus = 0; amogus < gamedata.length; amogus++) {
              gamedata[amogus].gotVoted = 0;
            }
          });
        }
      });
    });
  },
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
