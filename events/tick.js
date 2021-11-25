const { Client } = require("discord.js");


let i = 0;
let presenceCounter1 = 0;
let presenceCounter2 = 0;
module.exports = {
    name: 'tick',
    once: false,
    /**
     * 
     * @param {Client} client 
     */
    async execute(client) {

        // Incrementing everything
        presenceCounter1++
        // Incrementing everything
        console.log('tick')
        // Presence
        const presences = [
            {
                name: `${client.users.cache.size.toLocaleString()} fighters!`,
                type: `WATCHING`
            },
            {
                name: `${client.guilds.cache.size.toLocaleString()} servers!`,
                type: 'COMPETING'
            }
        ]
        if (presenceCounter1 == 10) {
            presenceCounter1 = 0;
            if (++presenceCounter2 >= presences.length) {
                presenceCounter2 = 0
            }

            client.user.setStatus({
                activity: presences[presenceCounter2]
            })
        }
        // Presence
        setTimeout(() => {
            client.emit('tick')
        }, 1000)
    }
}