const { Client } = require("discord.js");


let i = 0;
let presenceCounter1 = 0;
let presenceCounter2 = 0;
module.exports = {
    name: 'tick',
    once: false,
    /**
     * @param {Client} client 
     */
    async execute(client) {

        // Incrementing everything
        presenceCounter1++
        // Incrementing everything

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

            client.user.setActivity({
                name: presences[presenceCounter2].name,
                type: presences[presenceCounter2].type
            })
        }
        // Presence
        setTimeout(() => {
            client.emit('tick')
        }, 1000)
    }
}