const apikey = process.env.CATAPITOKEN;
const {
  Message,
  Client,
  Colors,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle
} = require('discord.js');
const querystring = require('node:querystring');
const r2 = require('r2');

module.exports = {
  name: 'pussy',
  cooldown: 5,
  /**
   *
   * @param {Message} message
   */
  async execute(message) {
    const images = await getImage(message.author.id);
    const generateButton = new ButtonBuilder()
      .setLabel('More Pussy')
      .setCustomId('more;pussy')
      .setStyle(ButtonStyle.Success);
    const row = new ActionRowBuilder().addComponents(generateButton);
    const mainMessage = await message.channel.send({
      embeds: [
        {
          title: 'SFW Pussy',
          image: {
            url: images[0].url
          },
          color: Colors.Blurple,
          footer: {
            text: "Some say there's a chance you can get NSFW Pussy."
          }
        }
      ],
      components: [row]
    });

    const collector = mainMessage.createMessageComponentCollector({
      idle: 30_000
    });
    collector.on('collect', async (button) => {
      if (button.user.id !== message.author.id) {
        return button.reply({
          ephemeral: true,
          content: 'Run your own command, fh pussy!'
        });
      }
      button.deferUpdate();
      const newImage = await getImage(button.user.id);
      return mainMessage.edit({
        embeds: [
          {
            title: 'SFW Pussy',
            image: { url: newImage[0].url },
            color: Colors.Blurple,
            footer: {
              text: "Some say there's a chance you can get NSFW Pussy."
            }
          }
        ],
        components: [row]
      });
    });
    collector.on('end', () => {
      generateButton.setDisabled();
      mainMessage.edit({
        components: [row]
      });
    });
  }
};

const getImage = async (id) => {
  var headers = {
    'X-API-KEY': apikey
  };
  var query_params = {
    mime_types: 'jpg,png',
    size: 'med',
    sub_id: id,
    limit: 1
  };

  let queryString = querystring.stringify(query_params);
  try {
    let _url = `https://api.thecatapi.com/v1/images/search?${queryString}`;
    var response = await r2.get(_url, { headers }).json;
  } catch (e) {
    console.log(e);
  }
  return response;
};
