module.exports = {
    name: 'snipe',
    async execute(message, args, client){
        const sniped = client.snipes.get(message.channel.id)
        console.log(sniped)
    }
}