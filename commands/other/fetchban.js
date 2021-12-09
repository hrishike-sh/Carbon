module.exports = {
  name: "fetchban",
  aliases: ["fetchbans", "baninfo"],
  args: true,
  usage: "<id>",
  description: "Check ban info about a certain user.",
  async execute(message, args) {
    const id = args[0];
    // daunt: move to config
    const roles = {
      mod: "824348974449819658",
      admin: "824539655134773269",
    };

    if (
      !message.member.roles.cache.some(
        (r) => r === roles.mod || r === roles.admin
      )
    ) {
      return;
    }
    let banInfo = await message.guild.fetchBan(id).catch(() => {
      return message.channel.send(
        "Either the user is not banned or the user ID provided is not valid."
      );
    });

    if (!banInfo) return;

    message.channel.send({
      embed: {
        description: `User: \`${
          banInfo.user.username + "#" + banInfo.user.discriminator
        }\`(${id})`,
        fields: [
          {
            name: "Reason",
            value: banInfo.reason,
          },
        ],
      },
    });
  },
};
