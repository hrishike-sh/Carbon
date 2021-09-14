module.exports = {
    name: 'message',
    async execute(message, client){
        if(message.channel.id !== '869217430533206027') return;
      console.log("GOT A EMSSAGE OR SOEMTHJING")
        if(!message.content.toLowerCase().startsWith('pls')) return;
    console.log("YO THE MESSAQGES STARTS FROM pls")
        const args = message.content.toLowerCase().trim().split(/ +g/)

        if(!args[1] || !['share', 'give'].includes(args[1].toLowerCase())) return;
      console.log("THE MESSAGE EVEN AHS GIVE/SHARE HOLY SHIT")
        const filter = (message) => message.author.id === '270904126974590976' && message.content.includes("You gave")
        const collector = message.channel.createMessageCollector(filter, { time: 60000 })

        collector.on('collect', (messages) => {
            console.log(messages)
        })
        collector.on('end', a => {
            console.log('asdfasdfadsf')
            console.log(a)
        })
    }
}