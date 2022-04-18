const { Message } = require('discord.js')

module.exports = {
    name: 'highlight',
    aliases: ['hl'],
    usage: '<add/remove/list> <highlight>',
    description: "Carl bot's highlight feature.",
    subcommands: ['add', 'remove', 'list', '+', '-'],
    /**
     * @param {Message} message
     * @param {String[]} args
     */
    async execute(message, args) {
        const example = `\n\nExample: \`fh hl add hrish\`, \`fh hl remove felli\` & \`fh hl list\``
        /**
         * boring
         * stuff
         * like
         * checking
         * perms
         * goes
         * here
         * yuh
         */

        const action = args[0]
        if (!action) {
            return message.reply('You must tell me what to do!' + example)
        }
        if (!this.subcommands.includes(action)) {
            return message.reply('Not a valid option.' + example)
        }
    },
}
