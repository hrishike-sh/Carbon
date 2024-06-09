const { Message, Client } = require('discord.js');
module.exports = {
  name: 'heist',
  /**
   *
   * @param {Message} message
   * @param {String[]} args
   * @param {Client} client
   */
  async execute(message, args, client) {
    if (!message.member.roles.cache.has('824348974449819658')) return;
    const channelList = [
      '870240187198885888',
      '824313123728261150',
      '824313288967192597',
      '824318942511890452',
      '834411149763674152',
      '828201396334755860',
      '824313259976556544',
      '824313275750547456',
      '828201384910258186',
      '824313306633863278',
      '832893535509676093',
      '834411113163784192',
      '831235618037825636',
      '831235657954361364',
      '857626803329433610',
      '881544533538635776'
    ];
    for (let i = 0; i < channelList.length; i++) {
      message.guild.channels.cache
        .get(channelList[i])
        .send({
          content: 'Test'
          //   content: `**100m Daily Heist**\n\n> Channel: <#839490512901767208>`
        })
        .then((msg) => {
          setTimeout(() => {
            msg.delete();
          }, 30_000);
        });
    }
  }
};
