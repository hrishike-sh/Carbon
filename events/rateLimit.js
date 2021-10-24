module.exports = {
    name: 'rateLimit',
    once: false,
    execute(rLI, client){
        const channel = client.channels.cache.get("901479377269833799")
        let channelID;
        let type;
        const path = rLI.path;
        const reg = /\d+/g
        if(path.includes('messages')){
            channelID = path.match(reg)[0]
            type = 'message'
        } else if (path.includes('reaction')){
            channelID = path.match(reg)[0]
            type = 'reaction'
        } else {
            channelID = path.match(reg)[0]
            console.log(path)
            type = 'Unknown, check console!'
        }
        channel.send({
            embed: {
                title: `Rate limited (<t:${(new Date / 1000).toFixed(0)}:R>)`,
                description: `Rate limit hit in <#${channelID}> for ${type}!`,
                fields: [
                    {
                        name: 'Timed out for',
                        value: rLI.timeout
                    },
                    {
                        name: 'Limit',
                        value: rLI.limit
                    }
                ]
            }
        })
    }
}