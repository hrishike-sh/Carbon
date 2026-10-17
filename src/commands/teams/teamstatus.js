const TeamDB = require('../../database/models/teams');
const { infoEmbed } = require('../../utils/embeds');
const { cleanTeamName } = require('../../utils/summerFight');

const MAX_DESCRIPTION_LENGTH = 3800;

function teamBlock(team) {
  return (
    `**${cleanTeamName(team.name) || 'Unnamed Team'}**: ` +
    `${team.points} points · ${team.users.length} members`
  );
}

function makePages(blocks) {
  const pages = [];
  let page = '';

  for (const block of blocks) {
    const next = page ? `${page}\n\n${block}` : block;
    if (next.length > MAX_DESCRIPTION_LENGTH && page) {
      pages.push(page);
      page = block;
    } else {
      page = next;
    }
  }

  if (page) pages.push(page);
  return pages;
}

module.exports = {
  name: 'teamstatus',
  aliases: ['teams', 'ts'],

  async execute(message) {
    const teams = await TeamDB.find({}).sort({ name: 1 });
    if (!teams.length) {
      return message.reply({
        embeds: [infoEmbed({ title: 'Team Status', description: 'No teams exist yet.' })]
      });
    }

    const pages = makePages(teams.map(teamBlock));

    for (let index = 0; index < pages.length; index += 1) {
      const payload = {
        embeds: [
          infoEmbed({
            title: pages.length > 1
              ? `Team Status (${index + 1}/${pages.length})`
              : 'Team Status',
            description: pages[index],
            timestamp: true
          })
        ],
        allowedMentions: { parse: [] }
      };

      if (index === 0) {
        await message.reply(payload);
      } else {
        await message.channel.send(payload);
      }
    }
  }
};
