
const giveawayModel = require('../database/models/giveaway')

module.exports = {
    name: 'clickButton',
    once: false,
    async execute(button, client){
        if(button.id !== 'giveaway-join') return;

        const gaw = await giveaway.findOne({ messageId: button.message.id })

        if(!gaw) return;

        if(gaw.entries.includes(button.clicker.user.id)){
            button.reply.send("You have already entered this giveaway.", true)
            return;
        }

        gaw.entries.push(button.clicker.user.id)
        gaw.save()

        button.reply.send("Your entry has been counted, good luck!", true)
    }
}