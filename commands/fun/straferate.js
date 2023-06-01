module.exports = {
  name: 'straferate',
  aliases: ['sr'],
  category: 'Fun',
  description:
    'STRAFE RATE STRAFE RATE STRAFE RATE STRAFE RATE STRAFE RATE STRAFE RATE STRAFE RATE  ',
  async execute(message, args) {
    const rate = Math.floor(Math.random() * 101);
    let what;
    if (message.mentions.users.size > 0) {
      what = message.mentions.users.first().username + ' is';
    }
    if (args[0] && !what) {
      what = args.join(' ') + ' is';
    }
    if (!what) what = 'You are';
    return message.channel.send({
      embeds: [
        {
          title: `Strafe r8 machine`,
          description: `${what} ${rate}% Strafe <:fh_strafe:864780923944828938>`
        }
      ]
    });
  }
};
