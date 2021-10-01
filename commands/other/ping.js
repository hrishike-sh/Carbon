module.exports = {
  name: 'ping',
  description: 'Pong!',
  execute(message, args, client){
    message.channel.send(`\`${client.ws.ping}\`ms`)
  }
}