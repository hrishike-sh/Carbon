const config = require('../../config');
const { createEmbed, errorEmbed, successEmbed, warningEmbed, Theme } = require('../../utils/embeds');
const {
  AutoReact,
  displayKeyword,
  displayReaction,
  ensureAutoReactIndexes,
  getKeywordFromArg,
  importApplicationEmoji,
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

async function resolveUsableReaction(message, rawReaction, client) {
  let reaction = normalizeReaction(rawReaction, client);
  let imported = false;

  if (!reaction) {
    const importedEmoji = await importApplicationEmoji(rawReaction, client).catch(() => null);
    if (importedEmoji) {
      reaction = importedEmoji.reaction;
      imported = importedEmoji.imported;
    }
  }

  if (!reaction) {
    return {
      reaction: null,
      imported: false,
      error: 'Missing or unavailable reaction. Use a Unicode emoji or custom emoji mention.'
    };
  }

  if (await canUseReaction(message, reaction)) {
    return { reaction, imported };
  }

  const importedEmoji = await importApplicationEmoji(rawReaction, client).catch(() => null);
  if (importedEmoji && await canUseReaction(message, importedEmoji.reaction)) {
    return {
      reaction: importedEmoji.reaction,
      imported: true
    };
  }

  return {
    reaction: null,
    imported: false,
    error: `I cannot use ${rawReaction || 'that emoji'} here. If this is a custom emoji, make sure it was sent as an emoji mention.`
  };
}

async function listAutoReacts(message) {
  const entries = await AutoReact.find({ guildId: config.ids.guildId }).sort({ keyword: 1, reaction: 1 });

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

    await ensureAutoReactIndexes();

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
      const removed = await AutoReact.find({
        guildId: config.ids.guildId,
        keyword
      });

      if (!removed.length) {
        return message.reply({
          embeds: [warningEmbed({ description: `${displayKeyword(keyword)} is not configured as an auto-react.` })],
          allowedMentions: { parse: [] }
        });
      }

      await AutoReact.deleteMany({ guildId: config.ids.guildId, keyword });
      await loadAutoReacts(client, config.ids.guildId);
      return message.reply({
        embeds: [
          successEmbed({
            title: 'Auto-react removed',
            description: `${displayKeyword(keyword)} will no longer trigger ${removed.map((entry) => displayReaction(entry.reaction)).join(' ')}.`
          })
        ],
        allowedMentions: { parse: [] }
      });
    }

    const rawReaction = args.shift();
    const resolvedReaction = await resolveUsableReaction(message, rawReaction, client);
    const reaction = resolvedReaction.reaction;
    if (!reaction) {
      return message.reply({
        embeds: [errorEmbed({
          title: 'Reaction unavailable',
          description: resolvedReaction.error
        })]
      });
    }

    const existing = await AutoReact.findOne({ guildId: config.ids.guildId, keyword, reaction });
    if (existing) {
      return message.reply({
        embeds: [
          warningEmbed({
            title: 'Auto-react already exists',
            description: `${displayKeyword(keyword)} already triggers ${displayReaction(reaction)}.`
          })
        ],
        allowedMentions: { parse: [] }
      });
    }

    const saved = await AutoReact.create({
      guildId: config.ids.guildId,
      keyword,
      reaction,
      createdBy: message.author.id,
      updatedAt: Date.now()
    });

    await loadAutoReacts(client, config.ids.guildId);

    return message.reply({
      embeds: [
        successEmbed({
          title: 'Auto-react added',
          description: [
            `${displayKeyword(saved.keyword)} will now trigger ${displayReaction(saved.reaction)}.`,
            resolvedReaction.imported ? 'I copied that emoji into the bot first because I could not use the original.' : null
          ].filter(Boolean).join('\n')
        })
      ],
      allowedMentions: { parse: [] }
    });
  }
};
