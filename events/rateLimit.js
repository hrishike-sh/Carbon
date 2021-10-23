module.exports = {
    name: 'rateLimit',
    once: false,
    execute(rLI, client){
        const channel = client.channels.cache.get("901479377269833799")

        channel.send({
            embed: {
                title: `Rate limited (<t:${(new Date / 1000).toFixed(0)}:R>)`,
                description: `Rate limit hit!`,
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