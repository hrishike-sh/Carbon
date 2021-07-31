const {
    Command
} = require('discord.js-commando');
const {
    MessageButton,
    MessageActionRow
} = require('discord-buttons')

module.exports = class AuctionCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'auction',
            group: "other",
            memberName: 'auction',
            description: 'Start an auction!',
        });
    }
    // fh auction starting bis / item name
    async run(message) {
        if(message.author.id !== '598918643727990784') return
        const prefix = 'fh auction'
        const args = message.content.slice(prefix.length).split('/')
        let rawBid = args[0]
        const item = args[1]

        if(!rawBid || rawBid === 'NaN'){
            return message.channel.send('Invalid amount!\n\nExample: \`fh auction 5e6 / 75 pizza\`')
        }

        const startingBid = getNumber(rawBid)
        const yesBut = new MessageButton()
            .setLabel('Yes')
            .setStyle('green')
            .setID('yesBut')
        const noBut = new MessageButton()   
            .setLabel('No')
            .setStyle('red')
            .setID('noBut')
        const row = new MessageActionRow()
            .addComponent(yesBut)
            .addComponent(noBut)
        const question = await message.channel.send('Are you sure you want to start the auction?', row)
        const qFilter = (button) => button.clicker.user.id === message.author.id
        const responseA = await question.awaitButtons(qFilter, { max: 1, time: 2e4 })
        const finalResponse = responseA.first()
        try{
            if(finalResponse.id === 'noBut'){
                await message.delete()
                await question.delete()
                return message.channel.send('Okay, operation cancelled')
            }

            message.channel.send('Starting the auction...')
            const mainFilter = (m) => m.content.toLowerCase().startsWith('bid ') 
            const collector = message.channel.createMessageCollector(mainFilter, { max: 1e3 })
            message.channel.send({embed: {
                title: 'AUCTION',
                description: `The auction has started the starting bid is **${startingBid} coins**!\nType \`bid {amount}\` to place your bid!`
            }})
            // main v 

            collector.on('collect', async (c) => {
                let bidCom = 'bid '
                let bid = c.content.replace(bidCom.toLowerCase(), '')
                const finalBid = getNumber(bid)
                if(finalBid === 'NaN'){
                    c.delete()
                    let t = await c.reply('Invalid bid')
                    await sleep(1500)
                   return t.delete()
                }

                let ourBid = startingBid;
                if(finalBid < startingBid){
                    await c.delete()
                    t = await message.reply('You cannot bid less than the starting bid!')
                    await sleep(1500)
                    return t.delete()
                }
            })



        } catch (e){
            message.channel.send(`${e}`)
        }
    }
}

const getNumber = (rawNumber) => {
    if(!rawNumber.endsWith('k') && !rawNumber.endsWith('m') && !rawNumber.endsWith('b') && isNaN(rawNumber[0][0])){
        return 'NaN'
    }
    if(rawNumber.endsWith('k')){
        rawNumber.replace('k', '')
        return parseInt(rawNumber) * 1000
    } else if(rawNumber.endsWith('m')){
        rawNumber.replace('m', '')
        return parseInt(rawNumber) * 1e6
    } else if(rawNumber.endsWith('b')){
        rawNumber.replace('b', '')
        return parseInt(rawNumber) * 1e9
    } else {
        return eval(rawNumber)
    }
}

function sleep(ms){
    return new Promise(resolve => setTimeout(resolve, ms))
}