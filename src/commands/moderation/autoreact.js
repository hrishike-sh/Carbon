const config = require('../../config');
const { createEmbed, errorEmbed, successEmbed, warningEmbed, Theme } = require('../../utils/embeds');
const {
  AutoReact,
  displayKeyword,
  displayReaction,
  getKeywordFromArg,
  loadAutoReacts,
  normalizeReaction
} = require('../../utils/autoReact');

const USAGE = [
  '`fh ar add <keyword> <reaction>`',
  '`fh ar remove <keyword>`',
  '`fh ar list`'
].join('\n');

function commandEmbed(title, description, color = Theme.info, fields = []) {
  return createEmbed({
    title,
    description,
    color,
    fields,
    footer: 'Auto-react',
    timestamp: true
  });
}

function isValidKeyword(keyword) {
  return /^\d{17,20}$/.test(keyword) || keyword.length >= 3;
}

async function canUseReaction(message, reaction) {
  try {
    const addedReaction = await message.react(reaction);
    await addedReaction.users.remove(message.client.user.id).catch(() => {});
    return true;
  } catch (err) {
    return false;
  }
}

async function listAutoReacts(message) {
  const entries = await AutoReact.find({ guildId: config.ids.guildId }).sort({ keyword: 1 });

  if (!entries.length) {
    return message.reply({
      embeds: [
        commandEmbed(
          'Auto-reacts',
          `No auto-reacts are configured yet.\n\n${USAGE}`,
          Theme.warning
        )
      ]
    });
  }

  const lines = entries.map((entry, index) => (
    `**${index + 1}.** ${displayKeyword(entry.keyword)} -> ${displayReaction(entry.reaction)}`
  ));

  return message.reply({
    embeds: [
      commandEmbed(
        'Auto-reacts',
        lines.join('\n').slice(0, 4000),
        Theme.info,
        [
          { name: 'Total', value: entries.length.toLocaleString(), inline: true },
          { name: 'Server', value: message.guild.name, inline: true }
        ]
      )
    ],
    allowedMentions: { parse: [] }
  });
}

module.exports = {
  name: 'autoreact',
  aliases: ['ar'],
  cooldown: 3,
  roles: [config.roles.staff.mod, config.roles.staff.admin],

  async execute(message, args, client) {
    if (message.guild.id !== config.ids.guildId) {
      return message.reply({
        embeds: [warningEmbed({ description: 'Auto-reacts can only be managed in Fighthub.' })]
      });
    }

    const subcommand = args.shift()?.toLowerCase();
    if (!subcommand || !['add', 'remove', 'list'].includes(subcommand)) {
      return message.reply({
        embeds: [
          commandEmbed('Auto-react', `Manage message keyword reactions.\n\n${USAGE}`)
        ]
      });
    }

    if (subcommand === 'list') {
      return listAutoReacts(message);
    }

    const keyword = getKeywordFromArg(args.shift());
    if (!keyword) {
      return message.reply({
        embeds: [errorEmbed({ description: `Missing keyword.\n\n${USAGE}` })]
      });
    }

    if (!isValidKeyword(keyword)) {
      return message.reply({
        embeds: [errorEmbed({ description: 'Keyword must be at least 3 characters long.' })]
      });
    }

    if (subcommand === 'remove') {
      const removed = await AutoReact.findOneAndDelete({
        guildId: config.ids.guildId,
        keyword
      });

      if (!removed) {
        return message.reply({
          embeds: [warningEmbed({ description: `${displayKeyword(keyword)} is not configured as an auto-react.` })],
          allowedMentions: { parse: [] }
        });
      }

      await loadAutoReacts(client, config.ids.guildId);
      return message.reply({
        embeds: [
          successEmbed({
            title: 'Auto-react removed',
            description: `${displayKeyword(keyword)} will no longer trigger ${displayReaction(removed.reaction)}.`
          })
        ],
        allowedMentions: { parse: [] }
      });
    }

    const rawReaction = args.shift();
    const reaction = normalizeReaction(rawReaction, client);
    if (!reaction) {
      return message.reply({
        embeds: [errorEmbed({ description: 'Missing or unavailable reaction. Use an emoji this bot can access.' })]
      });
    }

    const usable = await canUseReaction(message, reaction);
    if (!usable) {
      return message.reply({
        embeds: [
          errorEmbed({
            title: 'Reaction unavailable',
            description: `I cannot use ${rawReaction || 'that emoji'} here. Make sure I can add reactions and access that emoji.`
          })
        ]
      });
    }

    const existing = await AutoReact.findOne({ guildId: config.ids.guildId, keyword });
    const saved = await AutoReact.findOneAndUpdate(
      { guildId: config.ids.guildId, keyword },
      {
        guildId: config.ids.guildId,
        keyword,
        reaction,
        createdBy: existing?.createdBy || message.author.id,
        updatedAt: Date.now()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await loadAutoReacts(client, config.ids.guildId);

    return message.reply({
      embeds: [
        successEmbed({
          title: existing ? 'Auto-react updated' : 'Auto-react added',
          description: `${displayKeyword(saved.keyword)} will now trigger ${displayReaction(saved.reaction)}.`
        })
      ],
      allowedMentions: { parse: [] }
    });
  }
};
