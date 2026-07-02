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
  '`fh ar list`',
  '`fh ar self <reaction>`'
].join('\n');
const SELF_ALLOWED_ROLES = [
  '999911967319924817',
  '825965323500126208',
  '839803117646512128',
  '826197829126979635',
  '1126459041045024859'
];
const SELF_MAX_REACTIONS = 5;
const SELF_LOG_CHANNEL_ID = '1522275308990890104';

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

function canManageAutoReacts(member) {
  return member.roles.cache.hasAny(config.roles.staff.mod, config.roles.staff.admin);
}

function canUseSelfAutoReact(member) {
  return member.roles.cache.hasAny(...SELF_ALLOWED_ROLES);
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

async function sendSelfInfo(message) {
  const current = await AutoReact.countDocuments({
    guildId: config.ids.guildId,
    keyword: message.author.id
  });

  return message.reply({
    embeds: [
      commandEmbed(
        'Self auto-react',
        [
          `Use \`fh ar self <reaction>\` to add a reaction that triggers when you are pinged.`,
          `You can set up to **${SELF_MAX_REACTIONS}** self auto-reacts.`,
          'When you are pinged, Carbon will randomly pick **2** of your saved self auto-reacts.',
          '',
          `You currently have **${current}/${SELF_MAX_REACTIONS}** configured.`
        ].join('\n'),
        Theme.info
      )
    ],
    allowedMentions: { parse: [] }
  });
}

async function saveAutoReact({ message, client, keyword, reaction, createdBy }) {
  const existing = await AutoReact.findOne({ guildId: config.ids.guildId, keyword, reaction });
  if (existing) {
    return {
      saved: null,
      alreadyExists: true
    };
  }

  const saved = await AutoReact.create({
    guildId: config.ids.guildId,
    keyword,
    reaction,
    createdBy,
    updatedAt: Date.now()
  });

  await loadAutoReacts(client, config.ids.guildId);

  return {
    saved,
    alreadyExists: false
  };
}

async function sendSelfAutoReactLog(message, saved, resolvedReaction) {
  const logChannel = message.client.channels.cache.get(SELF_LOG_CHANNEL_ID) ||
    await message.client.channels.fetch(SELF_LOG_CHANNEL_ID).catch(() => null);
  if (!logChannel?.isTextBased()) return;

  await logChannel.send({
    content: `<@&${config.roles.staff.mod}>`,
    embeds: [
      commandEmbed(
        'Self auto-react added',
        `${message.author.toString()} set ${displayReaction(saved.reaction)} as a self auto-react.`,
        Theme.success,
        [
          { name: 'User', value: `${message.author.tag}\n\`${message.author.id}\``, inline: true },
          { name: 'Reaction', value: displayReaction(saved.reaction), inline: true },
          { name: 'Imported', value: resolvedReaction.imported ? 'Yes' : 'No', inline: true },
          { name: 'Source', value: `[Jump to command](${message.url})` }
        ]
      )
    ],
    allowedMentions: { roles: [config.roles.staff.mod] }
  }).catch(() => {});
}

async function removeSelfAutoReacts(message, args, client) {
  const rawReaction = args.shift();
  const query = {
    guildId: config.ids.guildId,
    keyword: message.author.id
  };

  if (rawReaction) {
    query.reaction = normalizeReaction(rawReaction, client) || rawReaction;
  }

  const removed = await AutoReact.find(query);
  if (!removed.length) {
    return message.reply({
      embeds: [
        warningEmbed({
          title: 'No self auto-reacts found',
          description: rawReaction
            ? `You do not have ${displayReaction(query.reaction)} set as a self auto-react.`
            : 'You do not have any self auto-reacts set.'
        })
      ],
      allowedMentions: { parse: [] }
    });
  }

  await AutoReact.deleteMany(query);
  await loadAutoReacts(client, config.ids.guildId);

  return message.reply({
    embeds: [
      successEmbed({
        title: 'Self auto-react removed',
        description: rawReaction
          ? `Removed ${displayReaction(removed[0].reaction)} from your self auto-reacts.`
          : `Removed ${removed.length} self auto-react${removed.length === 1 ? '' : 's'}: ${removed.map((entry) => displayReaction(entry.reaction)).join(' ')}`
      })
    ],
    allowedMentions: { parse: [] }
  });
}

module.exports = {
  name: 'autoreact',
  aliases: ['ar'],
  cooldown: 3,

  async execute(message, args, client) {
    if (message.guild.id !== config.ids.guildId) {
      return message.reply({
        embeds: [warningEmbed({ description: 'Auto-reacts can only be managed in Fighthub.' })]
      });
    }

    await ensureAutoReactIndexes();

    const subcommand = args.shift()?.toLowerCase();
    if (!subcommand || !['add', 'remove', 'list', 'self'].includes(subcommand)) {
      return message.reply({
        embeds: [
          commandEmbed('Auto-react', `Manage message keyword reactions.\n\n${USAGE}`)
        ]
      });
    }

    if (subcommand === 'self') {
      if (!canUseSelfAutoReact(message.member)) {
        return message.reply({
          embeds: [
            errorEmbed({
              title: 'Self auto-react unavailable',
              description: 'You need one of the eligible auto-react roles to set a self auto-react.'
            })
          ]
        });
      }

      if (!args.length) {
        return sendSelfInfo(message);
      }

      const existingSelfReactions = await AutoReact.countDocuments({
        guildId: config.ids.guildId,
        keyword: message.author.id
      });

      if (existingSelfReactions >= SELF_MAX_REACTIONS) {
        return message.reply({
          embeds: [
            warningEmbed({
              title: 'Self auto-react limit reached',
              description: `You can set up to ${SELF_MAX_REACTIONS} self auto-reacts. When you are pinged, Carbon randomly picks 2 of them.`
            })
          ]
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

      const result = await saveAutoReact({
        message,
        client,
        keyword: message.author.id,
        reaction,
        createdBy: message.author.id
      });

      if (result.alreadyExists) {
        return message.reply({
          embeds: [
            warningEmbed({
              title: 'Auto-react already exists',
              description: `${message.author.toString()} already triggers ${displayReaction(reaction)}.`
            })
          ],
          allowedMentions: { parse: [] }
        });
      }

      await sendSelfAutoReactLog(message, result.saved, resolvedReaction);

      return message.reply({
        embeds: [
          successEmbed({
            title: 'Self auto-react added',
            description: [
              `Whenever you are pinged, I will react with ${displayReaction(result.saved.reaction)}.`,
              'When you are pinged, I will randomly pick 2 of your saved self auto-reacts.',
              resolvedReaction.imported ? 'I copied that emoji into the bot first because I could not use the original.' : null,
              `Slots used: ${existingSelfReactions + 1}/${SELF_MAX_REACTIONS}`
            ].filter(Boolean).join('\n')
          })
        ],
        allowedMentions: { parse: [] }
      });
    }

    if (subcommand === 'remove') {
      const removeSelf = !canManageAutoReacts(message.member) ||
        !args.length ||
        ['self', 'me'].includes(args[0]?.toLowerCase());

      if (removeSelf) {
        const selfArgs = ['self', 'me'].includes(args[0]?.toLowerCase()) ? args.slice(1) : args;
        return removeSelfAutoReacts(message, selfArgs, client);
      }
    }

    if (!canManageAutoReacts(message.member)) {
      return message.reply({
        embeds: [errorEmbed({ description: 'You need to be a moderator to manage server auto-reacts.' })]
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

    const result = await saveAutoReact({
      message,
      client,
      keyword,
      reaction,
      createdBy: message.author.id
    });

    if (result.alreadyExists) {
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

    return message.reply({
      embeds: [
        successEmbed({
          title: 'Auto-react added',
          description: [
            `${displayKeyword(result.saved.keyword)} will now trigger ${displayReaction(result.saved.reaction)}.`,
            resolvedReaction.imported ? 'I copied that emoji into the bot first because I could not use the original.' : null
          ].filter(Boolean).join('\n')
        })
      ],
      allowedMentions: { parse: [] }
    });
  }
};
