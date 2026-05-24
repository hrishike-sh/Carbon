const { User } = require('discord.js');
const { readFileSync, writeFileSync } = require('fs');
const path = require('path');

module.exports = {
  name: 'userUpdate',
  /**
   *
   * @param {User} oldUser
   * @param {User} newUser
   */
  async execute(oldUser, newUser) {
    return;
    if (oldUser.username === newUser.username) return;
    const rawNames = readFileSync(
      path.join(__dirname, '../lib/Fighthub names.json'),
      'utf-8'
    );
    const names = JSON.parse(rawNames);

    const thisUser = names[oldUser.id];

    if (thisUser.past_names.includes(newUser.username)) return;

    names[oldUser.id] = {
      ...names[oldUser.id],
      past_names: [...names[oldUser.id].past_names, oldUser.username]
    };
  }
};
