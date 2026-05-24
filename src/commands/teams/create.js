const { Message, Client } = require('discord.js');
const TeamDB = require('../../database/models/teams');
const config = require('../../config');
module.exports = {
  name: 'create',
  /**
   * @param {Message} message Discord Message
   * @param {String[]} args Command Arguments
   * @param {Client} client Discord Client
   */
  async execute(message, args, client) {
    // fh create team name
    if (
      !message.member.roles.cache.hasAny(
        config.roles.staff.cman,
        config.roles.staff.admin,
        '1163857079300276254'
      )
    ) {
      return;
    }
    const teamName =
      args.join(' ') || 'Team ' + Math.floor(Math.random() * 100) + 1;

    let team = await TeamDB.findOne({ name: teamName });
    if (team) return message.reply('Team already exists!');
    team = new TeamDB({
      name: teamName
    });
    team.save();
    message.reply({
      embeds: [
        {
          title: 'Team created',
          description: `Name: ${teamName}\nDB ID: ${team._id}`
        }
      ]
    });
  }
};
