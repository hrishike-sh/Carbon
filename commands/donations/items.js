
module.exports = {
    name: 'itemvalues',
    aliases: ['itemv'],
    execute(message){
        const items = [
            {
                name: 'collectible 1',
                value: 100,
                type: 'c'
            },
            {
                name: 'pepeitem 1',
                value: 75,
                type: 'pi'
            },
            {
                name: 'collectible 2',
                value: 125,
                type: 'c'
            }
        ]
        const array = items.sort((a, b) => b.value = a.value)
        console.log(array)
        message.channel.send('logged')
    }
}