const { inspect } = require('util')
const axios = require('axios')
const {
    EmbedBuilder: Embed,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js')
const { AmariBot } = require('amaribot.js')
const Amari = new AmariBot(process.env.amariToken, {
    token: process.env.amariToken,
})
async function uploadResult(content) {
    const parseQueryString = (obj) => {
        let res = ''
        for (const key of Object.keys(obj)) {
            res += `${res === '' ? '' : '&'}${key}=${obj[key]}`
        }
        return res
    }
    const res = await axios.post(
        'https://hastepaste.com/api/create',
        parseQueryString({ raw: false, text: encodeURIComponent(content) }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )
    return res.data
}

module.exports = {
    name: 'eval',
    aliases: ['e'],
    category: 'Developer',
    descriprtion: 'Not for you to see.',
    async execute(message, args, client) {
        if (!client.config.idiots.includes(message.author.id)) return
        const hrish = client.channels.cache.get('897100501148127272')
        require('dotenv').config()
        let input = args.join(' ')
        if (input.match(/^```(js)?(.|\n)*```$/g)) {
            input = input.replace(/^```(js)?\n/g, '').replace(/```$/g, '')
        }

        let result
        try {
            result = await eval(
                input.includes('await') ? `(async()=>{${input}})();` : input
            )
            if (typeof result !== 'string') {
                result = inspect(result, {
                    depth: 1,
                })
            }
        } catch (e) {
            result = e.message
        }

        const tokenRegex = new RegExp(process.env.token, 'gi')
        const tokenRegex2 = new RegExp(process.env.amariToken, 'gi')
        let button = false
        let hasteURL = ''
        result = result.replace(tokenRegex, 'ok kiddo.')
        result = result.replace(tokenRegex2, 'https://youtu.be/iik25wqIuFo')
        if (result.length > 1000) {
            if (result.length >= 1024) {
                hasteURL = await uploadResult(result, {
                    input,
                })
                result = 'Too much to display here'
                button = true
            }
            result = `${result.slice(0, 1000)}...`
        }

        result = '```js' + '\n' + result + '```'

        const embed = new Embed().setTitle('EVALED').addFields([
            { name: '📥 Input', value: `\`\`\`js\n${input}\n\`\`\`` },
            { name: '📤 Output', value: result },
        ])

        await message.channel.send({
            embeds: [embed],
            components:
                button === true
                    ? [
                          new ActionRowBuilder({
                              components: [
                                  new ButtonBuilder({
                                      label: 'Eval Result',
                                      style: ButtonStyle.Link,
                                      url: hasteURL,
                                  }),
                              ],
                          }),
                      ]
                    : [],
        })
        await hrish.send({
            content: `${message.author.tag} (\`${message.author.id}\`) ran the eval command!`,
            embeds: [embed],
            components:
                button === true
                    ? [
                          new ActionRowBuilder({
                              components: [
                                  new ButtonBuilder({
                                      label: 'Eval Result',
                                      style: ButtonStyle.Link,
                                      url: hasteURL,
                                  }),
                              ],
                          }),
                      ]
                    : [],
        })
    },
}
