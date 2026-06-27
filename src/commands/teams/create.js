const TeamDB = require('../../database/models/teams');
const config = require('../../config');
const { successEmbed } = require('../../utils/embeds');
const { MIN_TEAM_MEMBERS, findTeamByName } = require('../../utils/summerFight');

async function parseMemberIds(message, args) {
  const ids = new Set();

  for (const member of message.mentions.members.values()) {
    ids.add(member.id);
  }

  for (const arg of args) {
    const match = arg.match(/^<@!?(\d{17,20})>$/) || arg.match(/^(\d{17,20})$/);
    if (!match) continue;

    const member =
      message.guild.members.cache.get(match[1]) ||
      (await message.guild.members.fetch(match[1]).catch(() => null));
    if (member) ids.add(member.id);
  }

  return [...ids];
}

function parseTeamName(args) {
  return args
    .filter((arg) => !/^<@!?\d{17,20}>$/.test(arg) && !/^\d{17,20}$/.test(arg))
    .join(' ')
    .trim();
}

module.exports = {
  name: 'create',
  aliases: ['createteam'],

  async execute(message, args, client) {
    if (
      !message.member.roles.cache.hasAny(
        config.roles.staff.cman,
        config.roles.staff.admin,
        '1163857079300276254'
      )
    ) {
      return;
    }

    const memberIds = await parseMemberIds(message, args);
    if (memberIds.length < MIN_TEAM_MEMBERS) {
      return message.reply(`Mention at least ${MIN_TEAM_MEMBERS} members for the team.`);
    }

    const teamName = parseTeamName(args);
    if (!teamName) return message.reply('Provide the team name.');

    let team = await findTeamByName(teamName);
    if (team) return message.reply('Team already exists!');

    const existingMemberTeam = await TeamDB.findOne({ users: { $in: memberIds } });
    if (existingMemberTeam) {
      return message.reply(
        `One of those members is already in **${existingMemberTeam.name}**.`
      );
    }

    team = new TeamDB({
      name: teamName,
      users: memberIds,
      lives: 5
    });
    await team.save();

    return message.reply({
      embeds: [
        successEmbed({
          title: 'Team created',
          description:
            `Name: ${teamName}\n` +
            `Members: ${memberIds.map((id) => `<@${id}>`).join(' ')}\n` +
            `Lives: ${team.lives}\n` +
            `DB ID: ${team._id}`
        })
      ],
      allowedMentions: { users: [] }
    });
  }
};
