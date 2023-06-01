module.exports = {
  name: 'ping',
  async execute(msg) {
    return msg.reply(`Pong! ${msg.client.ws.ping}ms`);
  }
};
