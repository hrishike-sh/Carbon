const {Calculator} = require('weky')
const {Command} = require('discord.js-commando');

module.exports = class CalculatorCommand extends Command {
  constructor(client){
    super(client, {
      name: 'calc',
      aliases: ['calculator'],
      group: "other",
      memberName: 'o1',
      description: 'A calculator, with **B U T T O N S** ofcourse',
    });
  }
    async run(message) {
      await Calculator(message)
    }
}