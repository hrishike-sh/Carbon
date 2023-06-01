const { countries } = require('country-flag-icons');

module.exports = {
  name: 'flag',
  execute(message) {
    const map = countries[Math.floor(Math.random() * countries.length)];
    const url = `https://flagcdn.com/w320/${map.toLowerCase()}.png`;
    return message.reply({
      embeds: [
        {
          image: {
            url
          }
        }
      ]
    });
  }
};
