const {
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
  PermissionsBitField,
  GuildVerificationLevel,
  GuildExplicitContentFilter,
  GuildDefaultMessageNotifications
} = require('discord.js');

const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'get_guild_summary',
      description: 'Read-only summary of the current guild, bot permissions, caller, roles, and channels.',
      parameters: {
        type: 'object',
        properties: {},
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_roles',
      description: 'Read-only search/list roles in the guild.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Optional role name or ID search.' },
          limit: { type: 'integer', minimum: 1, maximum: 25 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_channels',
      description: 'Read-only search/list channels in the guild.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Optional channel name or ID search.' },
          type: {
            type: 'string',
            enum: ['text', 'voice', 'category', 'announcement', 'forum', 'stage'],
            description: 'Optional channel type filter.'
          },
          limit: { type: 'integer', minimum: 1, maximum: 25 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_member_info',
      description: 'Read-only details for a guild member.',
      parameters: {
        type: 'object',
        required: ['user'],
        properties: {
          user: { type: 'string', description: 'User ID, mention, username, or display name.' }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_channel_info',
      description: 'Read-only details for a guild channel.',
      parameters: {
        type: 'object',
        required: ['channel'],
        properties: {
          channel: { type: 'string', description: 'Channel ID, mention, or name.' }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_role',
      description: 'Create a guild role.',
      parameters: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          color: { type: 'string', description: 'Hex color like #ff9900, color name, or empty for default.' },
          hoist: { type: 'boolean', description: 'Display separately in member list.' },
          mentionable: { type: 'boolean' },
          permissions: {
            type: 'array',
            items: { type: 'string' },
            description: 'Discord permission names, e.g. ManageMessages, BanMembers.'
          },
          reason: { type: 'string', maxLength: 512 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'edit_role',
      description: 'Edit a guild role name, color, display options, or permissions.',
      parameters: {
        type: 'object',
        required: ['role'],
        properties: {
          role: { type: 'string', description: 'Role ID, mention, or name.' },
          name: { type: 'string', minLength: 1, maxLength: 100 },
          color: { type: 'string' },
          hoist: { type: 'boolean' },
          mentionable: { type: 'boolean' },
          permissions: { type: 'array', items: { type: 'string' } },
          reason: { type: 'string', maxLength: 512 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_role',
      description: 'Delete a guild role.',
      parameters: {
        type: 'object',
        required: ['role'],
        properties: {
          role: { type: 'string', description: 'Role ID, mention, or name.' },
          reason: { type: 'string', maxLength: 512 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'assign_role',
      description: 'Add a role to a guild member.',
      parameters: {
        type: 'object',
        required: ['user', 'role'],
        properties: {
          user: { type: 'string', description: 'User ID, mention, username, or display name.' },
          role: { type: 'string', description: 'Role ID, mention, or name.' },
          reason: { type: 'string', maxLength: 512 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'remove_role',
      description: 'Remove a role from a guild member.',
      parameters: {
        type: 'object',
        required: ['user', 'role'],
        properties: {
          user: { type: 'string', description: 'User ID, mention, username, or display name.' },
          role: { type: 'string', description: 'Role ID, mention, or name.' },
          reason: { type: 'string', maxLength: 512 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_channel',
      description: 'Create a text, voice, category, announcement, forum, or stage channel.',
      parameters: {
        type: 'object',
        required: ['name', 'type'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          type: { type: 'string', enum: ['text', 'voice', 'category', 'announcement', 'forum', 'stage'] },
          parent: { type: 'string', description: 'Optional category ID, mention, or name.' },
          topic: { type: 'string', maxLength: 1024 },
          nsfw: { type: 'boolean' },
          slowmodeSeconds: { type: 'integer', minimum: 0, maximum: 21600 },
          bitrate: { type: 'integer', minimum: 8000 },
          userLimit: { type: 'integer', minimum: 0, maximum: 99 },
          reason: { type: 'string', maxLength: 512 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'edit_channel',
      description: 'Edit a guild channel.',
      parameters: {
        type: 'object',
        required: ['channel'],
        properties: {
          channel: { type: 'string', description: 'Channel ID, mention, or name.' },
          name: { type: 'string', minLength: 1, maxLength: 100 },
          topic: { type: 'string', maxLength: 1024 },
          parent: { type: 'string', description: 'Category ID/name, or nullText to remove parent.' },
          nsfw: { type: 'boolean' },
          slowmodeSeconds: { type: 'integer', minimum: 0, maximum: 21600 },
          bitrate: { type: 'integer', minimum: 8000 },
          userLimit: { type: 'integer', minimum: 0, maximum: 99 },
          position: { type: 'integer', minimum: 0 },
          reason: { type: 'string', maxLength: 512 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_channel',
      description: 'Delete a guild channel.',
      parameters: {
        type: 'object',
        required: ['channel'],
        properties: {
          channel: { type: 'string', description: 'Channel ID, mention, or name.' },
          reason: { type: 'string', maxLength: 512 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'set_channel_permission',
      description: 'Set permission overwrites for a role, user, or everyone on a channel.',
      parameters: {
        type: 'object',
        required: ['channel', 'targetType', 'target'],
        properties: {
          channel: { type: 'string', description: 'Channel ID, mention, or name.' },
          targetType: { type: 'string', enum: ['role', 'user', 'everyone'] },
          target: { type: 'string', description: 'Role/user ID, mention, name, or everyone.' },
          allow: { type: 'array', items: { type: 'string' }, description: 'Permission names to allow.' },
          deny: { type: 'array', items: { type: 'string' }, description: 'Permission names to deny.' },
          clear: { type: 'array', items: { type: 'string' }, description: 'Permission names to reset to neutral.' },
          reason: { type: 'string', maxLength: 512 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'send_channel_message',
      description: 'Send a message or simple embed to a guild channel. Mentions are disabled by default.',
      parameters: {
        type: 'object',
        properties: {
          channel: { type: 'string', description: 'Channel ID, mention, or name. Defaults to current channel.' },
          content: { type: 'string', maxLength: 1900 },
          embed: {
            type: 'object',
            properties: {
              title: { type: 'string', maxLength: 256 },
              description: { type: 'string', maxLength: 4096 },
              color: { type: 'string' },
              footer: { type: 'string', maxLength: 2048 }
            },
            additionalProperties: false
          }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'purge_messages',
      description: 'Bulk delete 1-100 recent messages in a channel.',
      parameters: {
        type: 'object',
        required: ['amount'],
        properties: {
          channel: { type: 'string', description: 'Channel ID, mention, or name. Defaults to current channel.' },
          amount: { type: 'integer', minimum: 1, maximum: 100 },
          reason: { type: 'string', maxLength: 512 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'pin_message',
      description: 'Pin a message in a channel.',
      parameters: {
        type: 'object',
        required: ['messageId'],
        properties: {
          channel: { type: 'string', description: 'Channel ID, mention, or name. Defaults to current channel.' },
          messageId: { type: 'string' },
          reason: { type: 'string', maxLength: 512 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'unpin_message',
      description: 'Unpin a message in a channel.',
      parameters: {
        type: 'object',
        required: ['messageId'],
        properties: {
          channel: { type: 'string', description: 'Channel ID, mention, or name. Defaults to current channel.' },
          messageId: { type: 'string' },
          reason: { type: 'string', maxLength: 512 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'timeout_member',
      description: 'Timeout a guild member for 1 minute to 28 days.',
      parameters: {
        type: 'object',
        required: ['user', 'durationMinutes'],
        properties: {
          user: { type: 'string', description: 'User ID, mention, username, or display name.' },
          durationMinutes: { type: 'integer', minimum: 1, maximum: 40320 },
          reason: { type: 'string', maxLength: 512 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'remove_timeout',
      description: 'Remove a guild member timeout.',
      parameters: {
        type: 'object',
        required: ['user'],
        properties: {
          user: { type: 'string', description: 'User ID, mention, username, or display name.' },
          reason: { type: 'string', maxLength: 512 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'kick_member',
      description: 'Kick a guild member.',
      parameters: {
        type: 'object',
        required: ['user'],
        properties: {
          user: { type: 'string', description: 'User ID, mention, username, or display name.' },
          reason: { type: 'string', maxLength: 512 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'ban_member',
      description: 'Ban a user or guild member.',
      parameters: {
        type: 'object',
        required: ['user'],
        properties: {
          user: { type: 'string', description: 'User ID, mention, username, or display name.' },
          deleteMessageSeconds: { type: 'integer', minimum: 0, maximum: 604800 },
          reason: { type: 'string', maxLength: 512 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'unban_user',
      description: 'Unban a user by ID.',
      parameters: {
        type: 'object',
        required: ['user'],
        properties: {
          user: { type: 'string', description: 'User ID or mention.' },
          reason: { type: 'string', maxLength: 512 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'set_nickname',
      description: 'Set or clear a guild member nickname.',
      parameters: {
        type: 'object',
        required: ['user'],
        properties: {
          user: { type: 'string', description: 'User ID, mention, username, or display name.' },
          nickname: { type: 'string', maxLength: 32, description: 'New nickname. Use an empty string to clear.' },
          reason: { type: 'string', maxLength: 512 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_invite',
      description: 'Create an invite for a channel.',
      parameters: {
        type: 'object',
        properties: {
          channel: { type: 'string', description: 'Channel ID, mention, or name. Defaults to current channel.' },
          maxAgeSeconds: { type: 'integer', minimum: 0, maximum: 604800 },
          maxUses: { type: 'integer', minimum: 0, maximum: 100 },
          temporary: { type: 'boolean' },
          unique: { type: 'boolean' },
          reason: { type: 'string', maxLength: 512 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_emoji',
      description: 'Create a custom emoji from an image URL.',
      parameters: {
        type: 'object',
        required: ['name', 'imageUrl'],
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 32 },
          imageUrl: { type: 'string', description: 'Direct image URL.' },
          reason: { type: 'string', maxLength: 512 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_emoji',
      description: 'Delete a custom emoji by ID, name, or emoji mention.',
      parameters: {
        type: 'object',
        required: ['emoji'],
        properties: {
          emoji: { type: 'string' },
          reason: { type: 'string', maxLength: 512 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_webhook',
      description: 'Create a webhook in a text or announcement channel.',
      parameters: {
        type: 'object',
        required: ['channel', 'name'],
        properties: {
          channel: { type: 'string', description: 'Channel ID, mention, or name.' },
          name: { type: 'string', minLength: 1, maxLength: 80 },
          avatarUrl: { type: 'string' },
          reason: { type: 'string', maxLength: 512 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_webhook',
      description: 'Delete a webhook by ID or URL.',
      parameters: {
        type: 'object',
        required: ['webhook'],
        properties: {
          webhook: { type: 'string', description: 'Webhook ID or URL.' },
          reason: { type: 'string', maxLength: 512 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'edit_guild',
      description: 'Edit basic guild settings such as name, description, filters, AFK channel, or notification defaults.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', minLength: 2, maxLength: 100 },
          description: { type: 'string', maxLength: 120, description: 'Server description. Use an empty string to clear.' },
          verificationLevel: { type: 'string', enum: ['None', 'Low', 'Medium', 'High', 'VeryHigh'] },
          explicitContentFilter: { type: 'string', enum: ['Disabled', 'MembersWithoutRoles', 'AllMembers'] },
          defaultMessageNotifications: { type: 'string', enum: ['AllMessages', 'OnlyMentions'] },
          afkChannel: { type: 'string', description: 'Voice channel ID/name. Use an empty string to clear.' },
          afkTimeout: { type: 'integer', enum: [60, 300, 900, 1800, 3600] },
          reason: { type: 'string', maxLength: 512 }
        },
        additionalProperties: false
      }
    }
  }
];

const MUTATING_TOOLS = new Set([
  'create_role',
  'edit_role',
  'delete_role',
  'assign_role',
  'remove_role',
  'create_channel',
  'edit_channel',
  'delete_channel',
  'set_channel_permission',
  'send_channel_message',
  'purge_messages',
  'pin_message',
  'unpin_message',
  'timeout_member',
  'remove_timeout',
  'kick_member',
  'ban_member',
  'unban_user',
  'set_nickname',
  'create_invite',
  'create_emoji',
  'delete_emoji',
  'create_webhook',
  'delete_webhook',
  'edit_guild'
]);

const TOOL_REQUIRED_PERMISSIONS = {
  create_role: [PermissionFlagsBits.ManageRoles],
  edit_role: [PermissionFlagsBits.ManageRoles],
  delete_role: [PermissionFlagsBits.ManageRoles],
  assign_role: [PermissionFlagsBits.ManageRoles],
  remove_role: [PermissionFlagsBits.ManageRoles],
  create_channel: [PermissionFlagsBits.ManageChannels],
  timeout_member: [PermissionFlagsBits.ModerateMembers],
  remove_timeout: [PermissionFlagsBits.ModerateMembers],
  kick_member: [PermissionFlagsBits.KickMembers],
  ban_member: [PermissionFlagsBits.BanMembers],
  unban_user: [PermissionFlagsBits.BanMembers],
  set_nickname: [PermissionFlagsBits.ManageNicknames],
  create_emoji: [PermissionFlagsBits.ManageGuildExpressions],
  delete_emoji: [PermissionFlagsBits.ManageGuildExpressions],
  edit_guild: [PermissionFlagsBits.ManageGuild]
};

const CHANNEL_TYPES = {
  text: ChannelType.GuildText,
  voice: ChannelType.GuildVoice,
  category: ChannelType.GuildCategory,
  announcement: ChannelType.GuildAnnouncement,
  forum: ChannelType.GuildForum,
  stage: ChannelType.GuildStageVoice
};

const GUILD_EDIT_ENUMS = {
  verificationLevel: GuildVerificationLevel,
  explicitContentFilter: GuildExplicitContentFilter,
  defaultMessageNotifications: GuildDefaultMessageNotifications
};

function isMutatingTool(name) {
  return MUTATING_TOOLS.has(name);
}

function summarizeToolCall(name, args) {
  const printable = JSON.stringify({ tool: name, args: args || {} }, null, 2);
  return printable.length > 1400 ? `${printable.slice(0, 1400)}...` : printable;
}

function success(message, data = {}) {
  return { ok: true, message, ...data };
}

function failure(message, data = {}) {
  return { ok: false, message, ...data };
}

function clampString(value, max) {
  if (typeof value !== 'string') return value;
  return value.length > max ? value.slice(0, max) : value;
}

function cleanReason(reason, fallback) {
  return clampString(reason || fallback || 'Carbon AI admin assistant', 512);
}

function extractId(value) {
  if (!value) return null;
  const match = String(value).match(/\d{15,25}/);
  return match ? match[0] : null;
}

function sameText(a, b) {
  return String(a || '').toLowerCase() === String(b || '').toLowerCase();
}

function includesText(a, b) {
  return String(a || '').toLowerCase().includes(String(b || '').toLowerCase());
}

function humanChannelType(type) {
  return Object.keys(CHANNEL_TYPES).find((key) => CHANNEL_TYPES[key] === type) || String(type);
}

function parsePermissionNames(input) {
  if (!input) return [];
  const list = Array.isArray(input) ? input : [input];
  const names = [];
  const unknown = [];

  for (const raw of list) {
    if (!raw) continue;
    const normalized = String(raw).replace(/[\s_-]/g, '').toLowerCase();
    const match = Object.keys(PermissionFlagsBits).find((key) => key.toLowerCase() === normalized);
    if (!match) {
      unknown.push(raw);
      continue;
    }
    names.push(match);
  }

  if (unknown.length) {
    const err = new Error(`Unknown permission(s): ${unknown.join(', ')}`);
    err.code = 'UNKNOWN_PERMISSIONS';
    throw err;
  }

  return names;
}

function parsePermissions(input) {
  return parsePermissionNames(input).map((name) => PermissionFlagsBits[name]);
}

function parseColor(color) {
  if (color === undefined || color === null || color === '') return undefined;
  const value = String(color).trim();
  if (/^#?[0-9a-f]{6}$/i.test(value)) {
    return Number.parseInt(value.replace('#', ''), 16);
  }
  return value;
}

function parseGuildEnum(field, value) {
  if (value === undefined) return undefined;
  const table = GUILD_EDIT_ENUMS[field];
  if (!table) return value;
  const normalized = String(value).replace(/[\s_-]/g, '').toLowerCase();
  const match = Object.keys(table).find((key) => key.toLowerCase() === normalized);
  if (!match) {
    throw new Error(`Invalid ${field}: ${value}`);
  }
  return table[match];
}

async function ensureMe(guild) {
  return guild.members.me || guild.members.fetchMe();
}

function ensureBotGuildPermissions(context, toolName) {
  const required = TOOL_REQUIRED_PERMISSIONS[toolName] || [];
  if (!required.length) return;

  const missing = context.me.permissions.missing(required);
  if (missing.length) {
    throw new Error(`I am missing Discord permission(s): ${missing.join(', ')}`);
  }
}

function ensureChannelPermissions(channel, member, permissions) {
  const channelPerms = channel.permissionsFor(member);
  if (!channelPerms) throw new Error(`I cannot read permissions for ${channel.name}.`);

  const missing = channelPerms.missing(permissions);
  if (missing.length) {
    throw new Error(`I am missing channel permission(s) in #${channel.name}: ${missing.join(', ')}`);
  }
}

function ensureRoleEditable(role, context) {
  if (role.managed) throw new Error(`Role "${role.name}" is managed by an integration and cannot be edited.`);
  if (role.id === context.guild.id) throw new Error('The @everyone role cannot be edited with this role tool.');
  if (role.position >= context.me.roles.highest.position) {
    throw new Error(`Role "${role.name}" is not below my highest role.`);
  }
}

function ensureAssignableRole(role, context) {
  if (role.id === context.guild.id) throw new Error('I cannot assign @everyone.');
  ensureRoleEditable(role, context);
}

function ensureModeratable(member, action, context) {
  if (member.id === context.guild.ownerId) throw new Error('I cannot moderate the server owner.');
  if (member.id === context.client.user.id) throw new Error('I cannot moderate myself.');
  if (member.id === context.message.author.id) throw new Error('I will not moderate the command caller through this assistant.');
  if (action === 'kick' && !member.kickable) throw new Error(`I cannot kick ${member.user.tag}; their role may be above mine.`);
  if (action === 'timeout' && !member.moderatable) throw new Error(`I cannot timeout ${member.user.tag}; their role may be above mine.`);
}

async function resolveRole(guild, value) {
  if (!value) throw new Error('Missing role.');
  const id = extractId(value);
  if (id) {
    const role = guild.roles.cache.get(id);
    if (role) return role;
  }

  const query = String(value).replace(/^@/, '').trim();
  const exact = guild.roles.cache.filter((role) => sameText(role.name, query));
  if (exact.size === 1) return exact.first();
  if (exact.size > 1) throw new Error(`Multiple roles named "${query}". Use the role ID.`);

  const partial = guild.roles.cache.filter((role) => includesText(role.name, query));
  if (partial.size === 1) return partial.first();
  if (partial.size > 1) {
    throw new Error(`Multiple roles match "${query}": ${partial.map((role) => `${role.name} (${role.id})`).slice(0, 8).join(', ')}`);
  }

  throw new Error(`Could not find role "${value}".`);
}

async function resolveChannel(guild, value, allowedTypes) {
  if (!value) throw new Error('Missing channel.');
  const id = extractId(value);
  if (id) {
    const channel = guild.channels.cache.get(id) || await guild.channels.fetch(id).catch(() => null);
    if (channel && (!allowedTypes || allowedTypes.includes(channel.type))) return channel;
  }

  const query = String(value).replace(/^#/, '').trim();
  const candidates = guild.channels.cache.filter((channel) => {
    if (allowedTypes && !allowedTypes.includes(channel.type)) return false;
    return sameText(channel.name, query);
  });
  if (candidates.size === 1) return candidates.first();
  if (candidates.size > 1) throw new Error(`Multiple channels named "${query}". Use the channel ID.`);

  const partial = guild.channels.cache.filter((channel) => {
    if (allowedTypes && !allowedTypes.includes(channel.type)) return false;
    return includesText(channel.name, query);
  });
  if (partial.size === 1) return partial.first();
  if (partial.size > 1) {
    throw new Error(`Multiple channels match "${query}": ${partial.map((channel) => `${channel.name} (${channel.id})`).slice(0, 8).join(', ')}`);
  }

  throw new Error(`Could not find channel "${value}".`);
}

async function resolveMember(guild, value) {
  if (!value) throw new Error('Missing user.');
  const id = extractId(value);
  if (id) {
    return guild.members.fetch(id).catch(() => {
      throw new Error(`Could not find member with ID ${id}.`);
    });
  }

  const query = String(value).replace(/^@/, '').trim().toLowerCase();
  await guild.members.fetch({ query, limit: 10 }).catch(() => null);

  const exact = guild.members.cache.filter((member) => {
    return sameText(member.user.username, query) ||
      sameText(member.user.tag, query) ||
      sameText(member.displayName, query);
  });
  if (exact.size === 1) return exact.first();
  if (exact.size > 1) throw new Error(`Multiple members match "${value}". Use a mention or ID.`);

  const partial = guild.members.cache.filter((member) => {
    return includesText(member.user.username, query) ||
      includesText(member.user.tag, query) ||
      includesText(member.displayName, query);
  });
  if (partial.size === 1) return partial.first();
  if (partial.size > 1) {
    throw new Error(`Multiple members match "${value}": ${partial.map((member) => `${member.user.tag} (${member.id})`).slice(0, 8).join(', ')}`);
  }

  throw new Error(`Could not find member "${value}".`);
}

async function resolveEmoji(guild, value) {
  if (!value) throw new Error('Missing emoji.');
  const id = extractId(value);
  if (id) {
    const emoji = guild.emojis.cache.get(id) || await guild.emojis.fetch(id).catch(() => null);
    if (emoji) return emoji;
  }

  const query = String(value).replace(/^:/, '').replace(/:$/, '').trim();
  const exact = guild.emojis.cache.filter((emoji) => sameText(emoji.name, query));
  if (exact.size === 1) return exact.first();
  if (exact.size > 1) throw new Error(`Multiple emojis named "${query}". Use the emoji ID.`);

  throw new Error(`Could not find emoji "${value}".`);
}

async function resolveWebhook(client, value) {
  if (!value) throw new Error('Missing webhook.');
  const urlMatch = String(value).match(/\/webhooks\/(\d{15,25})\/([^/\s]+)/);
  if (urlMatch) {
    return client.fetchWebhook(urlMatch[1], urlMatch[2]);
  }

  const id = extractId(value);
  if (!id) throw new Error('Webhook must be a webhook ID or URL.');
  return client.fetchWebhook(id);
}

function serializeRole(role) {
  return {
    id: role.id,
    name: role.name,
    position: role.position,
    color: role.hexColor,
    members: role.members.size,
    managed: role.managed,
    mentionable: role.mentionable,
    hoist: role.hoist
  };
}

function serializeChannel(channel) {
  return {
    id: channel.id,
    name: channel.name,
    type: humanChannelType(channel.type),
    parentId: channel.parentId || null,
    position: channel.position
  };
}

function getOrderedRoles(guild) {
  return guild.roles.cache
    .filter((role) => role.id !== guild.id)
    .sort((a, b) => b.position - a.position);
}

function getOrderedChannels(guild) {
  return guild.channels.cache.sort((a, b) => a.rawPosition - b.rawPosition);
}

async function executeTool(context, name, args = {}) {
  try {
    context.me = await ensureMe(context.guild);
    ensureBotGuildPermissions(context, name);

    switch (name) {
      case 'get_guild_summary':
        return getGuildSummary(context);
      case 'list_roles':
        return listRoles(context, args);
      case 'list_channels':
        return listChannels(context, args);
      case 'get_member_info':
        return getMemberInfo(context, args);
      case 'get_channel_info':
        return getChannelInfo(context, args);
      case 'create_role':
        return createRole(context, args);
      case 'edit_role':
        return editRole(context, args);
      case 'delete_role':
        return deleteRole(context, args);
      case 'assign_role':
        return assignRole(context, args);
      case 'remove_role':
        return removeRole(context, args);
      case 'create_channel':
        return createChannel(context, args);
      case 'edit_channel':
        return editChannel(context, args);
      case 'delete_channel':
        return deleteChannel(context, args);
      case 'set_channel_permission':
        return setChannelPermission(context, args);
      case 'send_channel_message':
        return sendChannelMessage(context, args);
      case 'purge_messages':
        return purgeMessages(context, args);
      case 'pin_message':
        return pinMessage(context, args, true);
      case 'unpin_message':
        return pinMessage(context, args, false);
      case 'timeout_member':
        return timeoutMember(context, args);
      case 'remove_timeout':
        return removeTimeout(context, args);
      case 'kick_member':
        return kickMember(context, args);
      case 'ban_member':
        return banMember(context, args);
      case 'unban_user':
        return unbanUser(context, args);
      case 'set_nickname':
        return setNickname(context, args);
      case 'create_invite':
        return createInvite(context, args);
      case 'create_emoji':
        return createEmoji(context, args);
      case 'delete_emoji':
        return deleteEmoji(context, args);
      case 'create_webhook':
        return createWebhook(context, args);
      case 'delete_webhook':
        return deleteWebhook(context, args);
      case 'edit_guild':
        return editGuild(context, args);
      default:
        return failure(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return failure(err.message || 'Tool failed.');
  }
}

async function getGuildSummary(context) {
  const { guild, me, message } = context;
  const topRoles = getOrderedRoles(guild).first(10).map(serializeRole);
  const sampleChannels = getOrderedChannels(guild).first(15).map(serializeChannel);

  return success('Guild summary loaded.', {
    guild: {
      id: guild.id,
      name: guild.name,
      ownerId: guild.ownerId,
      memberCount: guild.memberCount,
      verificationLevel: guild.verificationLevel,
      explicitContentFilter: guild.explicitContentFilter,
      defaultMessageNotifications: guild.defaultMessageNotifications
    },
    caller: {
      id: message.author.id,
      tag: message.author.tag,
      displayName: message.member.displayName
    },
    bot: {
      id: me.id,
      highestRole: me.roles.highest ? serializeRole(me.roles.highest) : null,
      permissions: me.permissions.toArray()
    },
    topRoles,
    sampleChannels
  });
}

async function listRoles(context, args) {
  const limit = Math.min(Math.max(Number(args.limit) || 15, 1), 25);
  const query = args.query ? String(args.query).replace(/^@/, '').trim() : null;
  let roles = getOrderedRoles(context.guild);

  if (query) {
    const id = extractId(query);
    roles = roles.filter((role) => role.id === id || includesText(role.name, query));
  }

  return success('Roles listed.', {
    roles: roles.first(limit).map(serializeRole),
    totalMatches: roles.size
  });
}

async function listChannels(context, args) {
  const limit = Math.min(Math.max(Number(args.limit) || 15, 1), 25);
  const query = args.query ? String(args.query).replace(/^#/, '').trim() : null;
  const type = args.type ? CHANNEL_TYPES[args.type] : null;
  let channels = getOrderedChannels(context.guild);

  if (type !== null && type !== undefined) {
    channels = channels.filter((channel) => channel.type === type);
  }
  if (query) {
    const id = extractId(query);
    channels = channels.filter((channel) => channel.id === id || includesText(channel.name, query));
  }

  return success('Channels listed.', {
    channels: channels.first(limit).map(serializeChannel),
    totalMatches: channels.size
  });
}

async function getMemberInfo(context, args) {
  const member = await resolveMember(context.guild, args.user);
  return success('Member info loaded.', {
    member: {
      id: member.id,
      tag: member.user.tag,
      displayName: member.displayName,
      joinedAt: member.joinedAt?.toISOString() || null,
      timedOutUntil: member.communicationDisabledUntil?.toISOString() || null,
      roles: member.roles.cache
        .filter((role) => role.id !== context.guild.id)
        .sort((a, b) => b.position - a.position)
        .map(serializeRole)
    }
  });
}

async function getChannelInfo(context, args) {
  const channel = await resolveChannel(context.guild, args.channel);
  const info = serializeChannel(channel);
  info.topic = channel.topic || null;
  info.nsfw = channel.nsfw || false;
  info.rateLimitPerUser = channel.rateLimitPerUser || 0;
  info.permissionOverwrites = channel.permissionOverwrites.cache.map((overwrite) => ({
    id: overwrite.id,
    type: overwrite.type,
    allow: new PermissionsBitField(overwrite.allow.bitfield).toArray(),
    deny: new PermissionsBitField(overwrite.deny.bitfield).toArray()
  }));

  return success('Channel info loaded.', { channel: info });
}

async function createRole(context, args) {
  const permissions = args.permissions ? parsePermissions(args.permissions) : undefined;
  const role = await context.guild.roles.create({
    name: clampString(args.name, 100),
    color: parseColor(args.color),
    hoist: Boolean(args.hoist),
    mentionable: Boolean(args.mentionable),
    permissions,
    reason: cleanReason(args.reason)
  });

  return success(`Created role "${role.name}".`, { role: serializeRole(role) });
}

async function editRole(context, args) {
  const role = await resolveRole(context.guild, args.role);
  ensureRoleEditable(role, context);

  const payload = {};
  if (args.name !== undefined) payload.name = clampString(args.name, 100);
  if (args.color !== undefined) payload.color = parseColor(args.color);
  if (args.hoist !== undefined) payload.hoist = Boolean(args.hoist);
  if (args.mentionable !== undefined) payload.mentionable = Boolean(args.mentionable);
  if (args.permissions !== undefined) payload.permissions = parsePermissions(args.permissions);

  if (!Object.keys(payload).length) return failure('No role changes were provided.');

  const edited = await role.edit(payload, cleanReason(args.reason));
  return success(`Edited role "${edited.name}".`, { role: serializeRole(edited) });
}

async function deleteRole(context, args) {
  const role = await resolveRole(context.guild, args.role);
  ensureRoleEditable(role, context);
  const data = serializeRole(role);
  await role.delete(cleanReason(args.reason));
  return success(`Deleted role "${data.name}".`, { role: data });
}

async function assignRole(context, args) {
  const member = await resolveMember(context.guild, args.user);
  const role = await resolveRole(context.guild, args.role);
  ensureAssignableRole(role, context);
  await member.roles.add(role, cleanReason(args.reason));
  return success(`Added "${role.name}" to ${member.user.tag}.`, {
    member: { id: member.id, tag: member.user.tag },
    role: serializeRole(role)
  });
}

async function removeRole(context, args) {
  const member = await resolveMember(context.guild, args.user);
  const role = await resolveRole(context.guild, args.role);
  ensureAssignableRole(role, context);
  await member.roles.remove(role, cleanReason(args.reason));
  return success(`Removed "${role.name}" from ${member.user.tag}.`, {
    member: { id: member.id, tag: member.user.tag },
    role: serializeRole(role)
  });
}

async function createChannel(context, args) {
  const type = CHANNEL_TYPES[args.type];
  if (type === undefined) return failure(`Unknown channel type: ${args.type}`);

  let parent;
  if (args.parent) {
    parent = await resolveChannel(context.guild, args.parent, [ChannelType.GuildCategory]);
  }

  const payload = {
    name: clampString(args.name, 100),
    type,
    parent: parent?.id,
    topic: args.topic,
    nsfw: args.nsfw,
    rateLimitPerUser: args.slowmodeSeconds,
    bitrate: args.bitrate,
    userLimit: args.userLimit,
    reason: cleanReason(args.reason)
  };

  const channel = await context.guild.channels.create(payload);
  return success(`Created channel #${channel.name}.`, { channel: serializeChannel(channel) });
}

async function editChannel(context, args) {
  const channel = await resolveChannel(context.guild, args.channel);
  ensureChannelPermissions(channel, context.me, [PermissionFlagsBits.ManageChannels]);
  const payload = {};

  if (args.name !== undefined) payload.name = clampString(args.name, 100);
  if (args.topic !== undefined && 'setTopic' in channel) payload.topic = args.topic;
  if (args.parent !== undefined) {
    if (args.parent === null || sameText(args.parent, 'null') || sameText(args.parent, 'none')) {
      payload.parent = null;
    } else {
      const parent = await resolveChannel(context.guild, args.parent, [ChannelType.GuildCategory]);
      payload.parent = parent.id;
    }
  }
  if (args.nsfw !== undefined) payload.nsfw = Boolean(args.nsfw);
  if (args.slowmodeSeconds !== undefined) payload.rateLimitPerUser = Number(args.slowmodeSeconds);
  if (args.bitrate !== undefined) payload.bitrate = Number(args.bitrate);
  if (args.userLimit !== undefined) payload.userLimit = Number(args.userLimit);
  if (args.position !== undefined) payload.position = Number(args.position);

  if (!Object.keys(payload).length) return failure('No channel changes were provided.');

  const edited = await channel.edit(payload, cleanReason(args.reason));
  return success(`Edited channel #${edited.name}.`, { channel: serializeChannel(edited) });
}

async function deleteChannel(context, args) {
  const channel = await resolveChannel(context.guild, args.channel);
  ensureChannelPermissions(channel, context.me, [PermissionFlagsBits.ManageChannels]);
  if (channel.id === context.message.channel.id) {
    throw new Error('I will not delete the channel this assistant session is running in. Run the request from another channel.');
  }
  const data = serializeChannel(channel);
  await channel.delete(cleanReason(args.reason));
  return success(`Deleted channel #${data.name}.`, { channel: data });
}

async function setChannelPermission(context, args) {
  const channel = await resolveChannel(context.guild, args.channel);
  ensureChannelPermissions(channel, context.me, [PermissionFlagsBits.ManageChannels]);
  const overwrite = {};

  for (const perm of parsePermissionNames(args.allow || [])) overwrite[perm] = true;
  for (const perm of parsePermissionNames(args.deny || [])) overwrite[perm] = false;
  for (const perm of parsePermissionNames(args.clear || [])) overwrite[perm] = null;

  if (!Object.keys(overwrite).length) return failure('No permission overwrites were provided.');

  let target;
  if (args.targetType === 'everyone') {
    target = context.guild.roles.everyone;
  } else if (args.targetType === 'role') {
    target = await resolveRole(context.guild, args.target);
  } else if (args.targetType === 'user') {
    target = await resolveMember(context.guild, args.target);
  } else {
    return failure('targetType must be role, user, or everyone.');
  }

  await channel.permissionOverwrites.edit(target, overwrite, { reason: cleanReason(args.reason) });
  return success(`Updated permissions for ${args.targetType} on #${channel.name}.`, {
    channel: serializeChannel(channel),
    target: { id: target.id, name: target.name || target.user?.tag || target.displayName }
  });
}

async function sendChannelMessage(context, args) {
  const channel = args.channel
    ? await resolveChannel(context.guild, args.channel, [ChannelType.GuildText, ChannelType.GuildAnnouncement])
    : context.message.channel;

  ensureChannelPermissions(channel, context.me, [PermissionFlagsBits.SendMessages]);

  const payload = {
    content: args.content ? clampString(args.content, 1900) : undefined,
    allowedMentions: { parse: [] }
  };

  if (args.embed) {
    const embed = new EmbedBuilder();
    if (args.embed.title) embed.setTitle(clampString(args.embed.title, 256));
    if (args.embed.description) embed.setDescription(clampString(args.embed.description, 4096));
    if (args.embed.color) embed.setColor(parseColor(args.embed.color));
    if (args.embed.footer) embed.setFooter({ text: clampString(args.embed.footer, 2048) });
    payload.embeds = [embed];
  }

  if (!payload.content && !payload.embeds) return failure('Message needs content or an embed.');

  const sent = await channel.send(payload);
  return success(`Sent message in #${channel.name}.`, {
    channel: serializeChannel(channel),
    messageId: sent.id,
    url: sent.url
  });
}

async function purgeMessages(context, args) {
  const channel = args.channel
    ? await resolveChannel(context.guild, args.channel, [ChannelType.GuildText, ChannelType.GuildAnnouncement])
    : context.message.channel;
  const amount = Math.min(Math.max(Number(args.amount) || 0, 1), 100);

  ensureChannelPermissions(channel, context.me, [PermissionFlagsBits.ManageMessages]);
  const deleted = await channel.bulkDelete(amount, true);
  return success(`Deleted ${deleted.size} message(s) in #${channel.name}.`, {
    deleted: deleted.size,
    requested: amount,
    skippedLikelyOlderThan14Days: deleted.size < amount
  });
}

async function pinMessage(context, args, shouldPin) {
  const channel = args.channel
    ? await resolveChannel(context.guild, args.channel, [ChannelType.GuildText, ChannelType.GuildAnnouncement])
    : context.message.channel;
  ensureChannelPermissions(channel, context.me, [PermissionFlagsBits.ManageMessages]);

  const target = await channel.messages.fetch(args.messageId).catch(() => null);
  if (!target) return failure(`Could not fetch message ${args.messageId} in #${channel.name}.`);

  if (shouldPin) {
    await target.pin(cleanReason(args.reason));
  } else {
    await target.unpin(cleanReason(args.reason));
  }

  return success(`${shouldPin ? 'Pinned' : 'Unpinned'} message in #${channel.name}.`, {
    channel: serializeChannel(channel),
    messageId: target.id,
    url: target.url
  });
}

async function timeoutMember(context, args) {
  const member = await resolveMember(context.guild, args.user);
  ensureModeratable(member, 'timeout', context);
  const minutes = Math.min(Math.max(Number(args.durationMinutes) || 1, 1), 40320);
  await member.timeout(minutes * 60 * 1000, cleanReason(args.reason));
  return success(`Timed out ${member.user.tag} for ${minutes} minute(s).`, {
    member: { id: member.id, tag: member.user.tag },
    durationMinutes: minutes
  });
}

async function removeTimeout(context, args) {
  const member = await resolveMember(context.guild, args.user);
  ensureModeratable(member, 'timeout', context);
  await member.timeout(null, cleanReason(args.reason));
  return success(`Removed timeout from ${member.user.tag}.`, {
    member: { id: member.id, tag: member.user.tag }
  });
}

async function kickMember(context, args) {
  const member = await resolveMember(context.guild, args.user);
  ensureModeratable(member, 'kick', context);
  const data = { id: member.id, tag: member.user.tag };
  await member.kick(cleanReason(args.reason));
  return success(`Kicked ${data.tag}.`, { member: data });
}

async function banMember(context, args) {
  let memberId = extractId(args.user);
  const reason = cleanReason(args.reason);
  const deleteMessageSeconds = Math.min(Math.max(Number(args.deleteMessageSeconds) || 0, 0), 604800);

  if (memberId) {
    const member = await context.guild.members.fetch(memberId).catch(() => null);
    if (member) {
      if (member.id === context.guild.ownerId) throw new Error('I cannot ban the server owner.');
      if (member.id === context.client.user.id) throw new Error('I cannot ban myself.');
      if (member.id === context.message.author.id) throw new Error('I will not ban the command caller through this assistant.');
      if (!member.bannable) throw new Error(`I cannot ban ${member.user.tag}; their role may be above mine.`);
    }
  } else {
    const member = await resolveMember(context.guild, args.user);
    if (member.id === context.guild.ownerId) throw new Error('I cannot ban the server owner.');
    if (member.id === context.client.user.id) throw new Error('I cannot ban myself.');
    if (member.id === context.message.author.id) throw new Error('I will not ban the command caller through this assistant.');
    if (!member.bannable) throw new Error(`I cannot ban ${member.user.tag}; their role may be above mine.`);
    memberId = member.id;
  }

  const target = memberId || args.user;
  await context.guild.members.ban(target, { deleteMessageSeconds, reason });
  return success(`Banned ${target}.`, { user: target, deleteMessageSeconds });
}

async function unbanUser(context, args) {
  const id = extractId(args.user);
  if (!id) return failure('Unban needs a user ID.');
  const user = await context.guild.members.unban(id, cleanReason(args.reason));
  return success(`Unbanned ${user.tag}.`, { user: { id: user.id, tag: user.tag } });
}

async function setNickname(context, args) {
  const member = await resolveMember(context.guild, args.user);
  if (member.id === context.guild.ownerId) throw new Error('I cannot edit the server owner nickname.');
  if (!member.manageable) throw new Error(`I cannot edit ${member.user.tag}; their role may be above mine.`);
  const nickname = args.nickname === undefined ||
    args.nickname === null ||
    args.nickname === '' ||
    sameText(args.nickname, 'null') ||
    sameText(args.nickname, 'none')
    ? null
    : args.nickname;
  await member.setNickname(nickname, cleanReason(args.reason));
  return success(`Updated nickname for ${member.user.tag}.`, {
    member: { id: member.id, tag: member.user.tag, nickname: member.nickname || null }
  });
}

async function createInvite(context, args) {
  const channel = args.channel
    ? await resolveChannel(context.guild, args.channel, [ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildAnnouncement, ChannelType.GuildStageVoice])
    : context.message.channel;

  ensureChannelPermissions(channel, context.me, [PermissionFlagsBits.CreateInstantInvite]);
  const invite = await channel.createInvite({
    maxAge: args.maxAgeSeconds ?? 3600,
    maxUses: args.maxUses ?? 0,
    temporary: Boolean(args.temporary),
    unique: args.unique !== false,
    reason: cleanReason(args.reason)
  });

  return success(`Created invite for #${channel.name}.`, {
    channel: serializeChannel(channel),
    code: invite.code,
    url: invite.url
  });
}

async function createEmoji(context, args) {
  const emoji = await context.guild.emojis.create({
    attachment: args.imageUrl,
    name: clampString(args.name, 32),
    reason: cleanReason(args.reason)
  });
  return success(`Created emoji :${emoji.name}:.`, {
    emoji: { id: emoji.id, name: emoji.name, url: emoji.url }
  });
}

async function deleteEmoji(context, args) {
  const emoji = await resolveEmoji(context.guild, args.emoji);
  const data = { id: emoji.id, name: emoji.name };
  await emoji.delete(cleanReason(args.reason));
  return success(`Deleted emoji :${data.name}:.`, { emoji: data });
}

async function createWebhook(context, args) {
  const channel = await resolveChannel(context.guild, args.channel, [ChannelType.GuildText, ChannelType.GuildAnnouncement]);
  ensureChannelPermissions(channel, context.me, [PermissionFlagsBits.ManageWebhooks]);

  const webhook = await channel.createWebhook({
    name: clampString(args.name, 80),
    avatar: args.avatarUrl || undefined,
    reason: cleanReason(args.reason)
  });

  return success(`Created webhook "${webhook.name}" in #${channel.name}.`, {
    webhook: { id: webhook.id, name: webhook.name, channelId: channel.id }
  });
}

async function deleteWebhook(context, args) {
  const webhook = await resolveWebhook(context.client, args.webhook);
  if (webhook.guildId && webhook.guildId !== context.guild.id) {
    return failure('That webhook is not in this guild.');
  }
  if (webhook.guildId === context.guild.id && webhook.channelId) {
    const channel = context.guild.channels.cache.get(webhook.channelId) ||
      await context.guild.channels.fetch(webhook.channelId).catch(() => null);
    if (channel) ensureChannelPermissions(channel, context.me, [PermissionFlagsBits.ManageWebhooks]);
  }
  const data = { id: webhook.id, name: webhook.name, channelId: webhook.channelId };
  await webhook.delete(cleanReason(args.reason));
  return success(`Deleted webhook "${data.name || data.id}".`, { webhook: data });
}

async function editGuild(context, args) {
  const payload = {};
  if (args.name !== undefined) payload.name = clampString(args.name, 100);
  if (args.description !== undefined) payload.description = args.description || null;
  if (args.verificationLevel !== undefined) payload.verificationLevel = parseGuildEnum('verificationLevel', args.verificationLevel);
  if (args.explicitContentFilter !== undefined) payload.explicitContentFilter = parseGuildEnum('explicitContentFilter', args.explicitContentFilter);
  if (args.defaultMessageNotifications !== undefined) payload.defaultMessageNotifications = parseGuildEnum('defaultMessageNotifications', args.defaultMessageNotifications);
  if (args.afkTimeout !== undefined) payload.afkTimeout = Number(args.afkTimeout);
  if (args.afkChannel !== undefined) {
    if (args.afkChannel === null || args.afkChannel === '' || sameText(args.afkChannel, 'null') || sameText(args.afkChannel, 'none')) {
      payload.afkChannel = null;
    } else {
      const channel = await resolveChannel(context.guild, args.afkChannel, [ChannelType.GuildVoice]);
      payload.afkChannel = channel;
    }
  }

  if (!Object.keys(payload).length) return failure('No guild changes were provided.');

  const edited = await context.guild.edit(payload, cleanReason(args.reason));
  return success('Edited guild settings.', {
    guild: {
      id: edited.id,
      name: edited.name,
      description: edited.description,
      verificationLevel: edited.verificationLevel,
      explicitContentFilter: edited.explicitContentFilter,
      defaultMessageNotifications: edited.defaultMessageNotifications,
      afkChannelId: edited.afkChannelId,
      afkTimeout: edited.afkTimeout
    }
  });
}

module.exports = {
  TOOL_DEFINITIONS,
  executeTool,
  isMutatingTool,
  summarizeToolCall
};
