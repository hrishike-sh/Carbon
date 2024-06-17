const { Message, Client } = require('discord.js');
const TeamDB = require('../../database/teams');
module.exports = {
  name: 'create',
  /**
   * @param {Message} message Discord Message
   * @param {String[]} args Command Arguments
   * @param {Client} client Discord Client
   */
  async execute(message, args, client) {
    // fh create <role_id> team name
    if (message.author.id !== '598918643727990784') return;
    const role =
      message.mentions.roles?.first() || message.guild.roles.cache.get(args[0]);
    if (!role) return message.reply('Mention the role dumbfuck.');

    args.shift();
    const teamName =
      args.join(' ') || 'Team ' + Math.floor(Math.random() * 100) + 1;

    let team = await TeamDB.findOne({ roleID: role.id });
    if (team) return message.reply('Team already exists!');
    team = new TeamDB({
      roleId: role.id,
      name: teamName
    });
    message.reply({
      embeds: [
        {
          title: 'Team created',
          color: 'GREEN',
          description: `Name: ${teamName}\nRole: <@&${role.id}>\nDB ID: ${team._id}`
        }
      ]
    });
  }
};
