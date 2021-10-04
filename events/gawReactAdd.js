
const giveaways = require('../database/models/giveaway')

module.exports = {
    name: 'messageReactionAdd',
    once: false,
    async execute(reaction, user, client){

    }
}

const isGiveaway = async (message) => {
    const gaw = await giveaways.findOne({ messageId: message.id })
    console.log("Giveaway: ", gaw)
    if(gaw){
        return true
    } else return false
}