module.exports = {
  name: 'ping',
  execute(message, args, client){
    message.channel.send(`\`${client.ws.ping}\`ms`)
  }
}