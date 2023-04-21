const {
  Message,
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  ButtonStyle
} = require('discord.js');
module.exports = {
  name: 'calculator',
  aliases: ['calc'],
  category: 'Utility',
  description: 'A :sparkles:Fancy:sparkles: calculator within discord.',
  /**
   * @param {Message} message
   * @param {String[]} args
   */
  async execute(message, args, client) {
    const sessionId = client.functions.randomHash();
    const arrays = [
      [
        ['7', `${sessionId}:7`, ButtonStyle.Secondary],
        ['8', `${sessionId}:8`, ButtonStyle.Secondary],
        ['9', `${sessionId}:9`, ButtonStyle.Secondary],
        ['✖', `${sessionId}:*`, ButtonStyle.Primary]
      ],
      [
        ['4', `${sessionId}:4`, ButtonStyle.Secondary],
        ['5', `${sessionId}:5`, ButtonStyle.Secondary],
        ['6', `${sessionId}:6`, ButtonStyle.Secondary],
        ['➖', `${sessionId}:-`, ButtonStyle.Primary]
      ],
      [
        ['1', `${sessionId}:1`, ButtonStyle.Secondary],
        ['2', `${sessionId}:2`, ButtonStyle.Secondary],
        ['3', `${sessionId}:3`, ButtonStyle.Secondary],
        ['➕', `${sessionId}:+`, ButtonStyle.Primary]
      ],
      [
        ['․', `${sessionId}:.`, ButtonStyle.Primary],
        ['0', `${sessionId}:0`, ButtonStyle.Secondary],
        ['➗', `${sessionId}:/`, ButtonStyle.Primary],
        ['=', `${sessionId}:=`, ButtonStyle.Success]
      ]
    ];
    const components = [
      new ActionRowBuilder(),
      new ActionRowBuilder(),
      new ActionRowBuilder(),
      new ActionRowBuilder()
    ];
    let i = 0;
    for (const array of arrays) {
      let j = 0;
      console.log(`---------------Main Array\n${array[i]}`);
      for (const arra of array) {
        console.log(arra[j]);
        console.log(
          `Label: ${arra[j][0]} - Custom ID: ${arra[j][1]} - Style: ${arra[j][2]}`
        );
        components[i].addComponents([
          new ButtonBuilder()
            .setLabel(arra[j])
            .setCustomId(arra[++j])
            .setStyle(arra[++j])
        ]);
        j = 0;
      }
      i++;
    }
    let amogus = [];
    const embed = new EmbedBuilder()
      .setTitle('🔢 Calculator')
      .setDescription(`\`\`\`\n${amogus.join('')}\n\`\`\``)
      .setColor('Green')
      .setFooter({
        text: 'This calculator can be used for the next five minutes.'
      });

    const mainMessage = await message.channel.send({
      embeds: [embed],
      components
    });
    const mainCollector = mainMessage.createMessageComponentCollector({
      filter: (b) => {
        if (b.user.id !== message.author.id) {
          return b.reply({
            content: 'Not for you.',
            ephemeral: true
          });
        } else return true;
      },
      time: 300000
    });
    const operationArray = ['+', '-', '/', '*'];
    let calculated = false;
    mainCollector.on('collect', async (button) => {
      button.deferUpdate();
      if (calculated) {
        calculated = false;
        amogus = [];
      }
      const thing = button.customId.split(':')[1];
      if (thing == '=') {
        // do the math
        calculated = true;
        const toBeCalculated = amogus.join('');
        const result = eval(toBeCalculated);
        embed.setDescription(`\`\`\`\n${result.toLocaleString()}\n\`\`\``);
        return mainMessage.edit({
          embeds: [embed]
        });
      }
      const operation = operationArray.includes(thing);
      console.log(operationArray, operation, amogus[-1], amogus);
      operation
        ? operationArray.includes(amogus[-1])
          ? (amogus[-1] = thing)
          : amogus.push(thing)
        : amogus.push(thing);
      /**
       * Explaining line 92-96
       * First IF the input is an operation(i.e. multiply, addition etc.), it will
       * check if the last input was an operation(else input will be 19**+-/123 or smth)
       * if it was an operation, overwrite the operation, if it was not an operation, add
       * an operation. ELSE add the number.
       */

      embed.setDescription(`\`\`\`\n${amogus.join('')}\n\`\`\``);
      return mainMessage.edit({
        embeds: [embed]
      });
    });
  }
};
