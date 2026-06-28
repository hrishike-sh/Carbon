const vm = require('vm');
const { inspect } = require('util');
const discord = require('discord.js');
const config = require('../config');
const {
  AuditLogEvent,
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
  PermissionsBitField,
  GuildVerificationLevel,
  GuildExplicitContentFilter,
  GuildDefaultMessageNotifications,
  GuildScheduledEventEntityType,
  GuildScheduledEventPrivacyLevel
} = require('discord.js');

const COLOR_ROLE_NAMES = [
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'pink',
  'black',
  'white',
  'gray',
  'grey',
  'brown',
  'cyan',
  'aqua',
  'teal',
  'lime',
  'mint',
  'magenta',
  'violet',
  'indigo',
  'gold',
  'silver',
  'maroon',
  'navy',
  'lavender',
  'peach',
  'crimson',
  'scarlet',
  'emerald',
  'sapphire'
];

const RANDOM_ROLE_NAMES = [
  'Nova',
  'Ember',
  'Aurora',
  'Comet',
  'Pulse',
  'Mirage',
  'Vertex',
  'Prism',
  'Echo',
  'Halo'
];

const RANDOM_ROLE_COLORS = [
  0xff4757,
  0xffa502,
  0xffd32a,
  0x2ed573,
  0x1e90ff,
  0x9b59b6,
  0xff6bcb,
  0x00cec9,
  0xf368e0,
  0x7bed9f
];

const DANGEROUS_PERMISSIONS = [
  'Administrator',
  'ManageGuild',
  'ManageRoles',
  'ManageChannels',
  'ManageWebhooks',
  'ManageMessages',
  'ManageThreads',
  'ManageGuildExpressions',
  'ManageEmojisAndStickers',
  'BanMembers',
  'KickMembers',
  'ModerateMembers',
  'MentionEveryone',
  'ViewAuditLog'
];

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
      name: 'get_eval_context',
      description: 'Read-only context for drafting manual fh eval JavaScript when no safe built-in Carbon tool can do the requested task. This never executes code.',
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
      name: 'run_reviewed_eval',
      description: 'Last-resort developer-only eval fallback. DeepSeek provides JavaScript, Carbon shows it to the command caller for button confirmation, then runs it and returns output. Use only when no built-in tool can do the task.',
      parameters: {
        type: 'object',
        required: ['purpose', 'code'],
        properties: {
          purpose: { type: 'string', minLength: 1, maxLength: 500, description: 'Plain-English reason this eval is needed.' },
          code: { type: 'string', minLength: 1, maxLength: 2500, description: 'JavaScript body to run inside an async function. Must return a concise summary string/object.' }
        },
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
      name: 'list_color_roles',
      description: 'Read-only list of roles that look like self-assignable color roles. Color roles mean roles named after colors such as red, blue, green, pink, purple, black, white, etc.; not every role with a non-default Discord color.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 30 }
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
      description: 'Create a guild role. Use "random" for name or color when the user asks for a random role name/color. Set positionAboveColorRoles when the user asks to place it above color roles.',
      parameters: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100, description: 'Role name, or "random".' },
          color: { type: 'string', description: 'Hex color like #ff9900, color name, "random", or empty for default.' },
          hoist: { type: 'boolean', description: 'Display separately in member list.' },
          mentionable: { type: 'boolean' },
          positionAboveColorRoles: { type: 'boolean', description: 'Move the new role above detected color roles after creating it.' },
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
      name: 'set_role_position',
      description: 'Move a role by exact position, above another role, below another role, or above detected color roles.',
      parameters: {
        type: 'object',
        required: ['role'],
        properties: {
          role: { type: 'string', description: 'Role ID, mention, or name.' },
          position: { type: 'integer', minimum: 1, description: 'Exact Discord role position.' },
          aboveRole: { type: 'string', description: 'Role ID/name to place this role above.' },
          belowRole: { type: 'string', description: 'Role ID/name to place this role below.' },
          aboveColorRoles: { type: 'boolean', description: 'Place this role above detected color roles.' },
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

TOOL_DEFINITIONS.push(
  {
    type: 'function',
    function: {
      name: 'find_members',
      description: 'Read-only search for guild members by ID, mention, username, tag, or display name.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Optional member search query.' },
          includeBots: { type: 'boolean' },
          limit: { type: 'integer', minimum: 1, maximum: 50 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_members_with_permissions',
      description: 'Read-only audit of members with dangerous permissions or specific permissions. Use this for questions like "who has dangerous permissions?"',
      parameters: {
        type: 'object',
        properties: {
          permissions: { type: 'array', items: { type: 'string' }, description: 'Permission names. Defaults to dangerous permissions.' },
          dangerousOnly: { type: 'boolean', description: 'Use the built-in dangerous permission set.' },
          includeBots: { type: 'boolean' },
          includeRoleDetails: { type: 'boolean' },
          limit: { type: 'integer', minimum: 1, maximum: 100 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_roles_with_permissions',
      description: 'Read-only audit of roles with dangerous permissions or specific permissions.',
      parameters: {
        type: 'object',
        properties: {
          permissions: { type: 'array', items: { type: 'string' }, description: 'Permission names. Defaults to dangerous permissions.' },
          dangerousOnly: { type: 'boolean' },
          limit: { type: 'integer', minimum: 1, maximum: 100 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_effective_permissions',
      description: 'Read-only effective guild or channel permissions for a member.',
      parameters: {
        type: 'object',
        required: ['user'],
        properties: {
          user: { type: 'string', description: 'User ID, mention, username, or display name.' },
          channel: { type: 'string', description: 'Optional channel ID, mention, or name.' }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_role_permissions',
      description: 'Add permissions to a role without replacing its existing permissions.',
      parameters: {
        type: 'object',
        required: ['role', 'permissions'],
        properties: {
          role: { type: 'string', description: 'Role ID, mention, or name.' },
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
      name: 'remove_role_permissions',
      description: 'Remove permissions from a role without replacing its other permissions.',
      parameters: {
        type: 'object',
        required: ['role', 'permissions'],
        properties: {
          role: { type: 'string', description: 'Role ID, mention, or name.' },
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
      name: 'lock_channel',
      description: 'Deny sending messages and thread messages for @everyone in a channel.',
      parameters: {
        type: 'object',
        properties: {
          channel: { type: 'string', description: 'Channel ID, mention, or name. Defaults to current thread/channel.' },
          targetRole: { type: 'string', description: 'Optional role to lock instead of @everyone.' },
          reason: { type: 'string', maxLength: 512 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'unlock_channel',
      description: 'Clear send-message denies for @everyone or a target role in a channel.',
      parameters: {
        type: 'object',
        properties: {
          channel: { type: 'string', description: 'Channel ID, mention, or name. Defaults to current thread/channel.' },
          targetRole: { type: 'string', description: 'Optional role to unlock instead of @everyone.' },
          reason: { type: 'string', maxLength: 512 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'clone_channel',
      description: 'Clone a guild channel.',
      parameters: {
        type: 'object',
        required: ['channel'],
        properties: {
          channel: { type: 'string', description: 'Channel ID, mention, or name.' },
          name: { type: 'string', minLength: 1, maxLength: 100 },
          reason: { type: 'string', maxLength: 512 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_recent_messages',
      description: 'Read-only list of recent messages in a channel.',
      parameters: {
        type: 'object',
        properties: {
          channel: { type: 'string', description: 'Channel ID, mention, or name. Defaults to current thread/channel.' },
          limit: { type: 'integer', minimum: 1, maximum: 50 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'fetch_message',
      description: 'Read-only fetch of one message by channel and message ID.',
      parameters: {
        type: 'object',
        required: ['messageId'],
        properties: {
          channel: { type: 'string', description: 'Channel ID, mention, or name. Defaults to current thread/channel.' },
          messageId: { type: 'string' }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'edit_message',
      description: 'Edit a bot-authored message by channel and message ID.',
      parameters: {
        type: 'object',
        required: ['messageId', 'content'],
        properties: {
          channel: { type: 'string', description: 'Channel ID, mention, or name. Defaults to current thread/channel.' },
          messageId: { type: 'string' },
          content: { type: 'string', maxLength: 1900 },
          reason: { type: 'string', maxLength: 512 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_message',
      description: 'Delete one message by channel and message ID.',
      parameters: {
        type: 'object',
        required: ['messageId'],
        properties: {
          channel: { type: 'string', description: 'Channel ID, mention, or name. Defaults to current thread/channel.' },
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
      name: 'crosspost_message',
      description: 'Publish/crosspost an announcement-channel message.',
      parameters: {
        type: 'object',
        required: ['channel', 'messageId'],
        properties: {
          channel: { type: 'string', description: 'Announcement channel ID, mention, or name.' },
          messageId: { type: 'string' }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_reaction',
      description: 'Add a reaction to a message.',
      parameters: {
        type: 'object',
        required: ['messageId', 'emoji'],
        properties: {
          channel: { type: 'string', description: 'Channel ID, mention, or name. Defaults to current thread/channel.' },
          messageId: { type: 'string' },
          emoji: { type: 'string', description: 'Unicode emoji or custom emoji ID/mention.' }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'clear_reactions',
      description: 'Remove all reactions from a message.',
      parameters: {
        type: 'object',
        required: ['messageId'],
        properties: {
          channel: { type: 'string', description: 'Channel ID, mention, or name. Defaults to current thread/channel.' },
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
      name: 'create_thread',
      description: 'Create a public or private thread in a text/announcement channel, optionally from a message ID.',
      parameters: {
        type: 'object',
        required: ['channel', 'name'],
        properties: {
          channel: { type: 'string', description: 'Parent text/announcement channel.' },
          name: { type: 'string', minLength: 1, maxLength: 100 },
          messageId: { type: 'string', description: 'Optional message ID to start the thread from.' },
          private: { type: 'boolean' },
          autoArchiveDuration: { type: 'integer', enum: [60, 1440, 4320, 10080] },
          slowmodeSeconds: { type: 'integer', minimum: 0, maximum: 21600 },
          reason: { type: 'string', maxLength: 512 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'edit_thread',
      description: 'Edit a thread name, archived state, locked state, invitable state, auto archive duration, or slowmode.',
      parameters: {
        type: 'object',
        required: ['thread'],
        properties: {
          thread: { type: 'string', description: 'Thread ID, mention, or name.' },
          name: { type: 'string', minLength: 1, maxLength: 100 },
          archived: { type: 'boolean' },
          locked: { type: 'boolean' },
          invitable: { type: 'boolean' },
          autoArchiveDuration: { type: 'integer', enum: [60, 1440, 4320, 10080] },
          slowmodeSeconds: { type: 'integer', minimum: 0, maximum: 21600 },
          reason: { type: 'string', maxLength: 512 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_thread_member',
      description: 'Add a member to a thread.',
      parameters: {
        type: 'object',
        required: ['thread', 'user'],
        properties: {
          thread: { type: 'string', description: 'Thread ID, mention, or name.' },
          user: { type: 'string', description: 'User ID, mention, username, or display name.' }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'remove_thread_member',
      description: 'Remove a member from a thread.',
      parameters: {
        type: 'object',
        required: ['thread', 'user'],
        properties: {
          thread: { type: 'string', description: 'Thread ID, mention, or name.' },
          user: { type: 'string', description: 'User ID, mention, username, or display name.' }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_threads',
      description: 'Read-only list of active threads in the guild.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 50 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_invites',
      description: 'Read-only list guild invites visible to the bot.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 50 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_invite',
      description: 'Delete an invite by code or URL.',
      parameters: {
        type: 'object',
        required: ['invite'],
        properties: {
          invite: { type: 'string', description: 'Invite code or URL.' },
          reason: { type: 'string', maxLength: 512 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_bans',
      description: 'Read-only list of banned users.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_webhooks',
      description: 'Read-only list of webhooks in one channel or all visible guild channels.',
      parameters: {
        type: 'object',
        properties: {
          channel: { type: 'string', description: 'Optional channel ID, mention, or name.' },
          limit: { type: 'integer', minimum: 1, maximum: 100 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_emojis',
      description: 'Read-only list of guild emojis.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'edit_emoji',
      description: 'Edit a custom emoji name.',
      parameters: {
        type: 'object',
        required: ['emoji', 'name'],
        properties: {
          emoji: { type: 'string', description: 'Emoji ID, name, or mention.' },
          name: { type: 'string', minLength: 2, maxLength: 32 },
          reason: { type: 'string', maxLength: 512 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_stickers',
      description: 'Read-only list of guild stickers.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 100 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_sticker',
      description: 'Delete a guild sticker by ID or name.',
      parameters: {
        type: 'object',
        required: ['sticker'],
        properties: {
          sticker: { type: 'string', description: 'Sticker ID or name.' },
          reason: { type: 'string', maxLength: 512 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'fetch_audit_logs',
      description: 'Read-only fetch of recent guild audit log entries. Requires ViewAuditLog.',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', description: 'Optional AuditLogEvent name like MemberBanAdd, RoleCreate, ChannelDelete.' },
          limit: { type: 'integer', minimum: 1, maximum: 25 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'move_member_voice',
      description: 'Move a member to a voice/stage channel.',
      parameters: {
        type: 'object',
        required: ['user', 'channel'],
        properties: {
          user: { type: 'string', description: 'User ID, mention, username, or display name.' },
          channel: { type: 'string', description: 'Voice or stage channel ID/name.' },
          reason: { type: 'string', maxLength: 512 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'disconnect_member_voice',
      description: 'Disconnect a member from voice.',
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
      name: 'server_mute_member',
      description: 'Set server mute for a voice member.',
      parameters: {
        type: 'object',
        required: ['user', 'muted'],
        properties: {
          user: { type: 'string', description: 'User ID, mention, username, or display name.' },
          muted: { type: 'boolean' },
          reason: { type: 'string', maxLength: 512 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'server_deafen_member',
      description: 'Set server deaf for a voice member.',
      parameters: {
        type: 'object',
        required: ['user', 'deafened'],
        properties: {
          user: { type: 'string', description: 'User ID, mention, username, or display name.' },
          deafened: { type: 'boolean' },
          reason: { type: 'string', maxLength: 512 }
        },
        additionalProperties: false
      }
    }
  }
);

TOOL_DEFINITIONS.push(
  {
    type: 'function',
    function: {
      name: 'list_scheduled_events',
      description: 'Read-only list of guild scheduled events.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'integer', minimum: 1, maximum: 50 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_scheduled_event',
      description: 'Create a guild scheduled event. External events need location and end time. Voice/stage events need a voice/stage channel.',
      parameters: {
        type: 'object',
        required: ['name', 'startTime'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string', maxLength: 1000 },
          startTime: { type: 'string', description: 'Date/time parseable by JavaScript Date, preferably ISO.' },
          endTime: { type: 'string', description: 'Date/time parseable by JavaScript Date, preferably ISO.' },
          entityType: { type: 'string', enum: ['external', 'voice', 'stage'] },
          channel: { type: 'string', description: 'Voice/stage channel for voice or stage events.' },
          location: { type: 'string', maxLength: 100, description: 'Location for external events.' },
          reason: { type: 'string', maxLength: 512 }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delete_scheduled_event',
      description: 'Delete a guild scheduled event by ID or name.',
      parameters: {
        type: 'object',
        required: ['event'],
        properties: {
          event: { type: 'string', description: 'Scheduled event ID or name.' },
          reason: { type: 'string', maxLength: 512 }
        },
        additionalProperties: false
      }
    }
  }
);

TOOL_DEFINITIONS.push(
  {
    type: 'function',
    function: {
      name: 'list_forum_tags',
      description: 'Read-only list of available tags in a forum channel.',
      parameters: {
        type: 'object',
        required: ['channel'],
        properties: {
          channel: { type: 'string', description: 'Forum channel ID, mention, or name.' }
        },
        additionalProperties: false
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_forum_post',
      description: 'Create a post/thread in a forum channel.',
      parameters: {
        type: 'object',
        required: ['channel', 'title', 'content'],
        properties: {
          channel: { type: 'string', description: 'Forum channel ID, mention, or name.' },
          title: { type: 'string', minLength: 1, maxLength: 100 },
          content: { type: 'string', maxLength: 1900 },
          tags: { type: 'array', items: { type: 'string' }, description: 'Forum tag IDs or names.' },
          reason: { type: 'string', maxLength: 512 }
        },
        additionalProperties: false
      }
    }
  }
);

const MUTATING_TOOLS = new Set([
  'run_reviewed_eval',
  'create_role',
  'edit_role',
  'set_role_position',
  'add_role_permissions',
  'remove_role_permissions',
  'delete_role',
  'assign_role',
  'remove_role',
  'create_channel',
  'edit_channel',
  'delete_channel',
  'set_channel_permission',
  'lock_channel',
  'unlock_channel',
  'clone_channel',
  'send_channel_message',
  'purge_messages',
  'pin_message',
  'unpin_message',
  'edit_message',
  'delete_message',
  'crosspost_message',
  'add_reaction',
  'clear_reactions',
  'timeout_member',
  'remove_timeout',
  'kick_member',
  'ban_member',
  'unban_user',
  'set_nickname',
  'create_invite',
  'delete_invite',
  'create_emoji',
  'edit_emoji',
  'delete_emoji',
  'delete_sticker',
  'create_webhook',
  'delete_webhook',
  'create_thread',
  'edit_thread',
  'add_thread_member',
  'remove_thread_member',
  'move_member_voice',
  'disconnect_member_voice',
  'server_mute_member',
  'server_deafen_member',
  'create_scheduled_event',
  'delete_scheduled_event',
  'create_forum_post',
  'edit_guild'
]);

const TOOL_REQUIRED_PERMISSIONS = {
  create_role: [PermissionFlagsBits.ManageRoles],
  edit_role: [PermissionFlagsBits.ManageRoles],
  set_role_position: [PermissionFlagsBits.ManageRoles],
  add_role_permissions: [PermissionFlagsBits.ManageRoles],
  remove_role_permissions: [PermissionFlagsBits.ManageRoles],
  delete_role: [PermissionFlagsBits.ManageRoles],
  assign_role: [PermissionFlagsBits.ManageRoles],
  remove_role: [PermissionFlagsBits.ManageRoles],
  create_channel: [PermissionFlagsBits.ManageChannels],
  clone_channel: [PermissionFlagsBits.ManageChannels],
  delete_invite: [PermissionFlagsBits.ManageGuild],
  list_invites: [PermissionFlagsBits.ManageGuild],
  list_webhooks: [PermissionFlagsBits.ManageWebhooks],
  timeout_member: [PermissionFlagsBits.ModerateMembers],
  remove_timeout: [PermissionFlagsBits.ModerateMembers],
  kick_member: [PermissionFlagsBits.KickMembers],
  ban_member: [PermissionFlagsBits.BanMembers],
  unban_user: [PermissionFlagsBits.BanMembers],
  set_nickname: [PermissionFlagsBits.ManageNicknames],
  list_bans: [PermissionFlagsBits.BanMembers],
  fetch_audit_logs: [PermissionFlagsBits.ViewAuditLog],
  create_emoji: [PermissionFlagsBits.ManageGuildExpressions],
  edit_emoji: [PermissionFlagsBits.ManageGuildExpressions],
  delete_emoji: [PermissionFlagsBits.ManageGuildExpressions],
  delete_sticker: [PermissionFlagsBits.ManageGuildExpressions],
  move_member_voice: [PermissionFlagsBits.MoveMembers],
  disconnect_member_voice: [PermissionFlagsBits.MoveMembers],
  server_mute_member: [PermissionFlagsBits.MuteMembers],
  server_deafen_member: [PermissionFlagsBits.DeafenMembers],
  create_scheduled_event: [PermissionFlagsBits.ManageEvents],
  delete_scheduled_event: [PermissionFlagsBits.ManageEvents],
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

function redactSensitive(value) {
  let text = String(value ?? '');
  const secrets = [
    process.env.token,
    process.env.mongopath,
    process.env.amariToken,
    process.env.deepseekApiKey,
    process.env.DEEPSEEK_API_KEY
  ].filter(Boolean);

  for (const secret of secrets) {
    text = text.split(secret).join('[redacted]');
  }

  return text
    .replace(/mfa\.[\w-]{20,}/gi, '[redacted-token]')
    .replace(/[A-Za-z0-9_-]{23,28}\.[A-Za-z0-9_-]{6,7}\.[A-Za-z0-9_-]{27,}/g, '[redacted-token]');
}

function inspectForEval(value) {
  if (typeof value === 'string') return redactSensitive(value);
  return redactSensitive(inspect(value, { depth: 2, maxArrayLength: 50, breakLength: 120 }));
}

function validateReviewedEvalCode(code) {
  if (typeof code !== 'string' || !code.trim()) {
    throw new Error('Eval code is empty.');
  }
  if (code.length > 2500) {
    throw new Error('Eval code is too long to review safely.');
  }

  const blocked = [
    /\bprocess\b/i,
    /\brequire\s*\(/i,
    /\bimport\s*\(/i,
    /\bmodule\b/i,
    /\bglobal(?:This)?\b/i,
    /\beval\s*\(/i,
    /\bFunction\b/i,
    /\bconstructor\b/i,
    /__proto__/i,
    /\bprototype\b/i,
    /\bchild_process\b/i,
    /\bfs\b/i,
    /\bhttp(?:s)?\b/i,
    /\bnet\b/i,
    /\btls\b/i,
    /\bdgram\b/i,
    /\bworker_threads\b/i,
    /\bvm\b/i,
    /\btoken\b/i,
    /\bmongopath\b/i,
    /\bdeepseek/i,
    /\.env\b/i
  ];

  const hit = blocked.find((pattern) => pattern.test(code));
  if (hit) {
    throw new Error(`Eval code contains a blocked pattern: ${hit}`);
  }
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
  if (sameText(value, 'random')) {
    return RANDOM_ROLE_COLORS[Math.floor(Math.random() * RANDOM_ROLE_COLORS.length)];
  }
  if (/^#?[0-9a-f]{6}$/i.test(value)) {
    return Number.parseInt(value.replace('#', ''), 16);
  }
  return value;
}

function wantsRandom(value) {
  if (!value) return false;
  const normalized = String(value).trim().toLowerCase();
  return ['random', 'random name', 'anything', 'surprise me'].includes(normalized);
}

function randomRoleName(guild) {
  const used = new Set(guild.roles.cache.map((role) => role.name.toLowerCase()));

  for (let i = 0; i < 20; i++) {
    const base = RANDOM_ROLE_NAMES[Math.floor(Math.random() * RANDOM_ROLE_NAMES.length)];
    const suffix = Math.floor(Math.random() * 900) + 100;
    const name = `${base} ${suffix}`;
    if (!used.has(name.toLowerCase())) return name;
  }

  return `Role ${Date.now().toString().slice(-5)}`;
}

function normalizeColorRoleName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z]+/g, ' ')
    .trim();
}

function isColorRole(role) {
  if (!role || role.managed) return false;
  const normalized = normalizeColorRoleName(role.name);
  if (!normalized) return false;
  const words = normalized.split(/\s+/g);
  return COLOR_ROLE_NAMES.some((color) => normalized === color || words.includes(color));
}

function getColorRoles(guild) {
  return guild.roles.cache
    .filter((role) => role.id !== guild.id && isColorRole(role))
    .sort((a, b) => b.position - a.position);
}

function highestAllowedRolePosition(context) {
  return Math.max(context.me.roles.highest.position - 1, 1);
}

function ensureRolePositionAllowed(context, position) {
  const max = highestAllowedRolePosition(context);
  if (position > max) {
    throw new Error(`I can only move roles up to position ${max}, directly below my highest role "${context.me.roles.highest.name}".`);
  }
  if (position < 1) {
    throw new Error('Role position must be at least 1.');
  }
}

function getAboveColorRolesTarget(context) {
  const colorRoles = getColorRoles(context.guild);
  if (!colorRoles.size) {
    throw new Error('I could not detect any color roles. Color roles are detected by names like red, blue, green, pink, purple, black, white, etc.');
  }

  const highestColorRole = colorRoles.first();
  const targetPosition = highestColorRole.position + 1;
  ensureRolePositionAllowed(context, targetPosition);

  return { colorRoles, highestColorRole, targetPosition };
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

async function resolveThread(guild, value) {
  if (!value) throw new Error('Missing thread.');
  const id = extractId(value);
  if (id) {
    const cached = guild.channels.cache.get(id);
    if (cached?.isThread?.()) return cached;
    const fetched = await guild.channels.fetch(id).catch(() => null);
    if (fetched?.isThread?.()) return fetched;
  }

  const query = String(value).replace(/^#/, '').trim();
  const active = await guild.channels.fetchActiveThreads().catch(() => null);
  const threads = active?.threads || guild.channels.cache.filter((channel) => channel.isThread?.());
  const exact = threads.filter((thread) => sameText(thread.name, query));
  if (exact.size === 1) return exact.first();
  if (exact.size > 1) throw new Error(`Multiple threads named "${query}". Use the thread ID.`);

  const partial = threads.filter((thread) => includesText(thread.name, query));
  if (partial.size === 1) return partial.first();
  if (partial.size > 1) {
    throw new Error(`Multiple threads match "${query}": ${partial.map((thread) => `${thread.name} (${thread.id})`).slice(0, 8).join(', ')}`);
  }

  throw new Error(`Could not find thread "${value}".`);
}

async function resolveSticker(guild, value) {
  if (!value) throw new Error('Missing sticker.');
  const stickers = await guild.stickers.fetch().catch(() => guild.stickers.cache);
  const id = extractId(value);
  if (id) {
    const sticker = stickers.get(id) || await guild.stickers.fetch(id).catch(() => null);
    if (sticker) return sticker;
  }

  const query = String(value).trim();
  const exact = stickers.filter((sticker) => sameText(sticker.name, query));
  if (exact.size === 1) return exact.first();
  if (exact.size > 1) throw new Error(`Multiple stickers named "${query}". Use the sticker ID.`);

  throw new Error(`Could not find sticker "${value}".`);
}

async function resolveScheduledEvent(guild, value) {
  if (!value) throw new Error('Missing scheduled event.');
  const events = await guild.scheduledEvents.fetch({ withUserCount: true }).catch(() => guild.scheduledEvents.cache);
  const id = extractId(value);
  if (id) {
    const event = events.get(id) || await guild.scheduledEvents.fetch({ guildScheduledEvent: id, withUserCount: true }).catch(() => null);
    if (event) return event;
  }

  const query = String(value).trim();
  const exact = events.filter((event) => sameText(event.name, query));
  if (exact.size === 1) return exact.first();
  if (exact.size > 1) throw new Error(`Multiple scheduled events named "${query}". Use the event ID.`);

  const partial = events.filter((event) => includesText(event.name, query));
  if (partial.size === 1) return partial.first();
  if (partial.size > 1) {
    throw new Error(`Multiple scheduled events match "${query}": ${partial.map((event) => `${event.name} (${event.id})`).slice(0, 8).join(', ')}`);
  }

  throw new Error(`Could not find scheduled event "${value}".`);
}

function parseInviteCode(value) {
  if (!value) throw new Error('Missing invite.');
  const match = String(value).match(/(?:discord\.gg\/|discord(?:app)?\.com\/invite\/)?([a-z0-9-]+)/i);
  if (!match) throw new Error('Invite must be a code or URL.');
  return match[1];
}

function resolveAuditLogEvent(value) {
  if (!value) return undefined;
  const normalized = String(value).replace(/[\s_-]/g, '').toLowerCase();
  const match = Object.keys(AuditLogEvent).find((key) => key.toLowerCase() === normalized);
  if (!match) throw new Error(`Unknown audit log action: ${value}`);
  return AuditLogEvent[match];
}

function resolvePermissionNames(args = {}) {
  if (args.permissions?.length) return parsePermissionNames(args.permissions);
  return DANGEROUS_PERMISSIONS.filter((name) => PermissionFlagsBits[name] !== undefined);
}

function matchedPermissionNames(permissions, names) {
  return names.filter((name) => permissions.has(PermissionFlagsBits[name]));
}

function serializeMember(member, opts = {}) {
  const data = {
    id: member.id,
    tag: member.user.tag,
    displayName: member.displayName,
    bot: member.user.bot,
    joinedAt: member.joinedAt?.toISOString() || null,
    timedOutUntil: member.communicationDisabledUntil?.toISOString() || null
  };

  if (opts.roles) {
    data.roles = member.roles.cache
      .filter((role) => role.id !== member.guild.id)
      .sort((a, b) => b.position - a.position)
      .map(serializeRole);
  }

  return data;
}

function serializeMessage(message) {
  return {
    id: message.id,
    channelId: message.channelId,
    authorId: message.author?.id || null,
    authorTag: message.author?.tag || null,
    content: clampString(message.content || '', 1000),
    createdAt: message.createdAt?.toISOString() || null,
    editedAt: message.editedAt?.toISOString() || null,
    pinned: message.pinned,
    url: message.url
  };
}

function serializeWebhook(webhook) {
  return {
    id: webhook.id,
    name: webhook.name,
    channelId: webhook.channelId,
    guildId: webhook.guildId,
    ownerId: webhook.owner?.id || null,
    type: webhook.type
  };
}

function serializeInvite(invite) {
  return {
    code: invite.code,
    url: invite.url,
    channelId: invite.channelId,
    inviterId: invite.inviter?.id || null,
    uses: invite.uses,
    maxUses: invite.maxUses,
    maxAge: invite.maxAge,
    temporary: invite.temporary,
    createdAt: invite.createdAt?.toISOString() || null,
    expiresAt: invite.expiresAt?.toISOString() || null
  };
}

async function resolveMessage(context, args = {}, allowedTypes) {
  const channel = args.channel
    ? await resolveChannel(context.guild, args.channel, allowedTypes)
    : context.message.channel;
  if (!channel?.messages?.fetch) throw new Error('That channel does not support messages.');

  const target = await channel.messages.fetch(args.messageId).catch(() => null);
  if (!target) throw new Error(`Could not fetch message ${args.messageId} in #${channel.name}.`);
  return { channel, message: target };
}

function serializeRole(role) {
  return {
    id: role.id,
    name: role.name,
    position: role.position,
    color: role.hexColor,
    isColorRole: isColorRole(role),
    members: role.members.size,
    managed: role.managed,
    mentionable: role.mentionable,
    hoist: role.hoist
  };
}

function getDetectedColorRoles(guild, limit = 30) {
  return getColorRoles(guild).first(limit).map(serializeRole);
}

function getColorRoleSummary(guild, limit = 12) {
  const roles = getDetectedColorRoles(guild, limit);
  if (!roles.length) {
    return 'No color roles detected by name. Color roles are roles named red, blue, green, pink, purple, black, white, etc.';
  }

  return roles
    .map((role) => `${role.name} (${role.id}) position ${role.position}, ${role.color}`)
    .join('\n');
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
  const handlers = {
    get_guild_summary: getGuildSummary,
    get_eval_context: getEvalContext,
    run_reviewed_eval: runReviewedEval,
    list_roles: listRoles,
    list_color_roles: listColorRoles,
    list_channels: listChannels,
    find_members: findMembers,
    list_members_with_permissions: listMembersWithPermissions,
    list_roles_with_permissions: listRolesWithPermissions,
    get_effective_permissions: getEffectivePermissions,
    get_member_info: getMemberInfo,
    get_channel_info: getChannelInfo,
    create_role: createRole,
    edit_role: editRole,
    set_role_position: setRolePosition,
    add_role_permissions: addRolePermissions,
    remove_role_permissions: removeRolePermissions,
    delete_role: deleteRole,
    assign_role: assignRole,
    remove_role: removeRole,
    create_channel: createChannel,
    edit_channel: editChannel,
    delete_channel: deleteChannel,
    set_channel_permission: setChannelPermission,
    lock_channel: lockChannel,
    unlock_channel: unlockChannel,
    clone_channel: cloneChannel,
    send_channel_message: sendChannelMessage,
    list_recent_messages: listRecentMessages,
    fetch_message: fetchMessage,
    edit_message: editMessage,
    delete_message: deleteMessage,
    crosspost_message: crosspostMessage,
    add_reaction: addReaction,
    clear_reactions: clearReactions,
    purge_messages: purgeMessages,
    pin_message: (ctx, toolArgs) => pinMessage(ctx, toolArgs, true),
    unpin_message: (ctx, toolArgs) => pinMessage(ctx, toolArgs, false),
    timeout_member: timeoutMember,
    remove_timeout: removeTimeout,
    kick_member: kickMember,
    ban_member: banMember,
    unban_user: unbanUser,
    set_nickname: setNickname,
    create_invite: createInvite,
    list_invites: listInvites,
    delete_invite: deleteInvite,
    create_emoji: createEmoji,
    edit_emoji: editEmoji,
    delete_emoji: deleteEmoji,
    list_emojis: listEmojis,
    list_stickers: listStickers,
    delete_sticker: deleteSticker,
    create_webhook: createWebhook,
    delete_webhook: deleteWebhook,
    list_webhooks: listWebhooks,
    create_thread: createThread,
    edit_thread: editThread,
    add_thread_member: addThreadMember,
    remove_thread_member: removeThreadMember,
    list_threads: listThreads,
    list_bans: listBans,
    fetch_audit_logs: fetchAuditLogs,
    move_member_voice: moveMemberVoice,
    disconnect_member_voice: disconnectMemberVoice,
    server_mute_member: serverMuteMember,
    server_deafen_member: serverDeafenMember,
    list_scheduled_events: listScheduledEvents,
    create_scheduled_event: createScheduledEvent,
    delete_scheduled_event: deleteScheduledEvent,
    list_forum_tags: listForumTags,
    create_forum_post: createForumPost,
    edit_guild: editGuild
  };

  try {
    context.me = await ensureMe(context.guild);
    ensureBotGuildPermissions(context, name);

    const handler = handlers[name];
    if (!handler) return failure(`Unknown tool: ${name}`);
    return await handler(context, args);
  } catch (err) {
    return failure(err.message || 'Tool failed.');
  }
}

async function getEvalContext(context) {
  const { guild, message, me, client } = context;

  return success('Eval drafting context loaded. Generate code for manual review only; do not execute it.', {
    evalCommand: {
      prefixForms: ['fh eval <javascript>', 'fh e <javascript>'],
      execution: 'src/commands/dev/eval.js evaluates the provided JavaScript inside the eval command function.',
      availableVariables: [
        'message',
        'args',
        'client',
        'require',
        'process',
        'console'
      ],
      preImportedInEvalFile: [
        'Embed from discord.js EmbedBuilder',
        'ActionRowBuilder',
        'ButtonBuilder',
        'ButtonStyle'
      ],
      asyncBehavior: 'If the snippet text contains "await", the eval command wraps it as (async()=>{ ... })();. Prefer snippets that use await and return a concise string.',
      codeBlockBehavior: 'The eval command strips ```js code fences, so fenced JavaScript is acceptable for display.',
      access: 'The existing eval command is developer-allowlisted. Carbon must never execute generated eval code automatically.'
    },
    discordContext: {
      discordJs: 'v14',
      guild: {
        id: guild.id,
        name: guild.name,
        ownerId: guild.ownerId,
        memberCount: guild.memberCount
      },
      assistantThread: {
        id: message.channel.id,
        name: message.channel.name,
        parentId: message.channel.parentId || null
      },
      originalCommandChannel: message.originalMessage ? {
        id: message.originalMessage.channel.id,
        name: message.originalMessage.channel.name,
        type: message.originalMessage.channel.type
      } : null,
      invoker: {
        id: message.author.id,
        tag: message.author.tag,
        displayName: message.member.displayName
      },
      bot: {
        id: client.user.id,
        tag: client.user.tag,
        highestRole: me.roles.highest ? serializeRole(me.roles.highest) : null,
        guildPermissions: me.permissions.toArray()
      },
      detectedColorRoles: getDetectedColorRoles(guild, 20)
    },
    snippetRules: [
      'Return only a concise explanation plus one JavaScript code block for fh eval.',
      'Do not include token, API keys, process.env dumps, child_process, filesystem deletion, or external network calls unless the user explicitly requested that exact thing.',
      'Use explicit IDs from context whenever possible instead of resolving by fuzzy names.',
      'Use discord.js v14 APIs and require("discord.js") inside the snippet for needed constants/classes.',
      'Check bot permissions and role hierarchy before mutating roles, members, channels, or messages.',
      'For dangerous/bulk operations, write the snippet so it previews what it will change before doing it, or clearly mark where the developer should review the target list.',
      'Use allowedMentions: { parse: [] } for sends unless the user explicitly wants pings.',
      'End snippets with return "summary"; so eval output is readable.'
    ],
    exampleSnippetShape: [
      'const { PermissionFlagsBits } = require("discord.js");',
      'const guild = client.guilds.cache.get("GUILD_ID") || message.guild;',
      'const me = guild.members.me || await guild.members.fetchMe();',
      'if (!me.permissions.has(PermissionFlagsBits.ManageRoles)) return "Missing ManageRoles";',
      '// ...review target IDs, do work...',
      'return "Done: changed X items";'
    ].join('\n')
  });
}

async function runReviewedEval(context, args) {
  if (!config.ids.devUserIds.includes(context.message.author.id)) {
    throw new Error('Reviewed eval fallback is developer-only.');
  }

  const code = String(args.code || '').trim();
  validateReviewedEvalCode(code);

  const logs = [];
  const originalMessage = context.message.originalMessage || context.message;
  const sandbox = {
    client: context.client,
    guild: context.guild,
    message: originalMessage,
    channel: context.message.channel,
    thread: context.message.channel,
    originChannel: originalMessage.channel || null,
    author: context.message.author,
    member: context.message.member,
    me: context.me,
    discord,
    PermissionFlagsBits,
    PermissionsBitField,
    ChannelType,
    console: {
      log: (...items) => logs.push(items.map(inspectForEval).join(' ')),
      warn: (...items) => logs.push(items.map(inspectForEval).join(' ')),
      error: (...items) => logs.push(items.map(inspectForEval).join(' '))
    },
    setTimeout,
    clearTimeout,
    Date,
    Math,
    JSON,
    String,
    Number,
    Boolean,
    Array,
    Object,
    Map,
    Set,
    RegExp,
    BigInt,
    Promise
  };

  const script = new vm.Script(`"use strict"; (async () => {\n${code}\n})()`, {
    filename: 'carbon-reviewed-eval.vm'
  });
  const vmContext = vm.createContext(sandbox, {
    name: 'CarbonReviewedEval'
  });

  const resultPromise = script.runInContext(vmContext, {
    timeout: 1000,
    displayErrors: true
  });
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Reviewed eval timed out after 15 seconds.')), 15000);
  });

  const result = await Promise.race([Promise.resolve(resultPromise), timeout]);
  const output = inspectForEval(result);
  const logOutput = logs.join('\n');

  return success('Reviewed eval executed.', {
    purpose: clampString(args.purpose, 500),
    output: clampString(output || 'undefined', 3500),
    logs: clampString(logOutput || '', 3500)
  });
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

async function listColorRoles(context, args) {
  const limit = Math.min(Math.max(Number(args.limit) || 20, 1), 30);
  const roles = getColorRoles(context.guild);

  return success('Detected color roles listed.', {
    roles: roles.first(limit).map(serializeRole),
    totalMatches: roles.size,
    detectionRule: 'Color roles are detected by role names like red, blue, green, pink, purple, black, white, etc.; staff/bot roles with non-default colors are not counted unless their names match color words.'
  });
}

async function findMembers(context, args) {
  const limit = Math.min(Math.max(Number(args.limit) || 20, 1), 50);
  const includeBots = Boolean(args.includeBots);
  const query = args.query ? String(args.query).replace(/^@/, '').trim() : '';

  if (query) {
    await context.guild.members.fetch({ query, limit }).catch(() => null);
  } else if (context.guild.members.cache.size < Math.min(context.guild.memberCount, limit)) {
    await context.guild.members.fetch({ limit }).catch(() => null);
  }

  let members = context.guild.members.cache;
  if (!includeBots) members = members.filter((member) => !member.user.bot);
  if (query) {
    const id = extractId(query);
    members = members.filter((member) => {
      return member.id === id ||
        includesText(member.user.username, query) ||
        includesText(member.user.tag, query) ||
        includesText(member.displayName, query);
    });
  }

  return success('Members listed.', {
    members: members.first(limit).map((member) => serializeMember(member, { roles: true })),
    totalMatches: members.size
  });
}

async function listMembersWithPermissions(context, args) {
  const limit = Math.min(Math.max(Number(args.limit) || 50, 1), 100);
  const permissionNames = resolvePermissionNames(args);
  const includeBots = Boolean(args.includeBots);
  const includeRoleDetails = Boolean(args.includeRoleDetails);

  const members = await context.guild.members.fetch().catch(() => context.guild.members.cache);
  const matches = [];

  for (const member of members.values()) {
    if (!includeBots && member.user.bot) continue;
    const matched = matchedPermissionNames(member.permissions, permissionNames);
    if (!matched.length) continue;

    const item = {
      ...serializeMember(member),
      matchedPermissions: matched
    };

    if (includeRoleDetails) {
      item.rolesGrantingDangerousPermissions = member.roles.cache
        .filter((role) => role.id !== context.guild.id)
        .map((role) => ({
          ...serializeRole(role),
          matchedPermissions: matchedPermissionNames(role.permissions, permissionNames)
        }))
        .filter((role) => role.matchedPermissions.length);
    }

    matches.push(item);
  }

  matches.sort((a, b) => b.matchedPermissions.length - a.matchedPermissions.length || a.tag.localeCompare(b.tag));

  return success('Permission audit complete.', {
    permissionSet: permissionNames,
    totalMembersChecked: members.size,
    matchingMemberCount: matches.length,
    members: matches.slice(0, limit),
    truncated: matches.length > limit
  });
}

async function listRolesWithPermissions(context, args) {
  const limit = Math.min(Math.max(Number(args.limit) || 50, 1), 100);
  const permissionNames = resolvePermissionNames(args);
  const roles = getOrderedRoles(context.guild)
    .map((role) => ({
      ...serializeRole(role),
      matchedPermissions: matchedPermissionNames(role.permissions, permissionNames)
    }))
    .filter((role) => role.matchedPermissions.length);

  return success('Role permission audit complete.', {
    permissionSet: permissionNames,
    matchingRoleCount: roles.length,
    roles: roles.slice(0, limit),
    truncated: roles.length > limit
  });
}

async function getEffectivePermissions(context, args) {
  const member = await resolveMember(context.guild, args.user);
  let permissions = member.permissions;
  let channel = null;

  if (args.channel) {
    channel = await resolveChannel(context.guild, args.channel);
    permissions = channel.permissionsFor(member);
    if (!permissions) throw new Error(`Could not resolve permissions for ${member.user.tag} in #${channel.name}.`);
  }

  const names = permissions.toArray();
  const dangerous = matchedPermissionNames(permissions, DANGEROUS_PERMISSIONS.filter((name) => PermissionFlagsBits[name] !== undefined));

  return success('Effective permissions loaded.', {
    member: serializeMember(member, { roles: true }),
    channel: channel ? serializeChannel(channel) : null,
    permissions: names,
    dangerousPermissions: dangerous
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
  const name = wantsRandom(args.name) ? randomRoleName(context.guild) : clampString(args.name, 100);
  const positionTarget = args.positionAboveColorRoles ? getAboveColorRolesTarget(context) : null;
  const role = await context.guild.roles.create({
    name,
    color: parseColor(args.color),
    hoist: Boolean(args.hoist),
    mentionable: Boolean(args.mentionable),
    permissions,
    reason: cleanReason(args.reason)
  });

  let finalRole = role;
  if (positionTarget) {
    finalRole = await role.setPosition(positionTarget.targetPosition, {
      reason: cleanReason(args.reason, 'Carbon AI admin assistant: place role above color roles')
    });
  }

  return success(`Created role "${finalRole.name}".`, {
    role: serializeRole(finalRole),
    placedAboveColorRoles: Boolean(positionTarget),
    highestColorRoleBelow: positionTarget ? serializeRole(positionTarget.highestColorRole) : null
  });
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

async function setRolePosition(context, args) {
  const role = await resolveRole(context.guild, args.role);
  ensureRoleEditable(role, context);

  let targetPosition;
  let relativeTo = null;

  if (args.aboveColorRoles) {
    const target = getAboveColorRolesTarget(context);
    targetPosition = target.targetPosition;
    relativeTo = {
      mode: 'aboveColorRoles',
      highestColorRole: serializeRole(target.highestColorRole),
      detectedColorRoleCount: target.colorRoles.size
    };
  } else if (args.aboveRole) {
    const targetRole = await resolveRole(context.guild, args.aboveRole);
    targetPosition = targetRole.position + 1;
    relativeTo = { mode: 'aboveRole', role: serializeRole(targetRole) };
  } else if (args.belowRole) {
    const targetRole = await resolveRole(context.guild, args.belowRole);
    targetPosition = targetRole.position - 1;
    relativeTo = { mode: 'belowRole', role: serializeRole(targetRole) };
  } else if (args.position !== undefined) {
    targetPosition = Number(args.position);
    relativeTo = { mode: 'position' };
  } else {
    return failure('Provide position, aboveRole, belowRole, or aboveColorRoles.');
  }

  ensureRolePositionAllowed(context, targetPosition);
  const moved = await role.setPosition(targetPosition, {
    reason: cleanReason(args.reason, 'Carbon AI admin assistant: move role')
  });

  return success(`Moved role "${moved.name}" to position ${moved.position}.`, {
    role: serializeRole(moved),
    requestedPosition: targetPosition,
    relativeTo
  });
}

async function addRolePermissions(context, args) {
  const role = await resolveRole(context.guild, args.role);
  ensureRoleEditable(role, context);
  const permissionNames = parsePermissionNames(args.permissions);
  if (!permissionNames.length) return failure('No permissions were provided.');

  const permissions = new PermissionsBitField(role.permissions.bitfield);
  permissions.add(permissionNames.map((name) => PermissionFlagsBits[name]));
  const edited = await role.edit({ permissions, reason: cleanReason(args.reason) });

  return success(`Added permissions to "${edited.name}".`, {
    role: serializeRole(edited),
    addedPermissions: permissionNames,
    permissions: edited.permissions.toArray()
  });
}

async function removeRolePermissions(context, args) {
  const role = await resolveRole(context.guild, args.role);
  ensureRoleEditable(role, context);
  const permissionNames = parsePermissionNames(args.permissions);
  if (!permissionNames.length) return failure('No permissions were provided.');

  const permissions = new PermissionsBitField(role.permissions.bitfield);
  permissions.remove(permissionNames.map((name) => PermissionFlagsBits[name]));
  const edited = await role.edit({ permissions, reason: cleanReason(args.reason) });

  return success(`Removed permissions from "${edited.name}".`, {
    role: serializeRole(edited),
    removedPermissions: permissionNames,
    permissions: edited.permissions.toArray()
  });
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

async function lockChannel(context, args) {
  const channel = args.channel ? await resolveChannel(context.guild, args.channel) : context.message.channel;
  if (!channel.permissionOverwrites?.edit) throw new Error('That channel does not support permission overwrites.');
  ensureChannelPermissions(channel, context.me, [PermissionFlagsBits.ManageChannels]);

  const target = args.targetRole ? await resolveRole(context.guild, args.targetRole) : context.guild.roles.everyone;
  await channel.permissionOverwrites.edit(target, {
    SendMessages: false,
    AddReactions: false,
    CreatePublicThreads: false,
    CreatePrivateThreads: false,
    SendMessagesInThreads: false
  }, { reason: cleanReason(args.reason, 'Carbon AI admin assistant: lock channel') });

  return success(`Locked #${channel.name} for ${target.name}.`, {
    channel: serializeChannel(channel),
    target: serializeRole(target)
  });
}

async function unlockChannel(context, args) {
  const channel = args.channel ? await resolveChannel(context.guild, args.channel) : context.message.channel;
  if (!channel.permissionOverwrites?.edit) throw new Error('That channel does not support permission overwrites.');
  ensureChannelPermissions(channel, context.me, [PermissionFlagsBits.ManageChannels]);

  const target = args.targetRole ? await resolveRole(context.guild, args.targetRole) : context.guild.roles.everyone;
  await channel.permissionOverwrites.edit(target, {
    SendMessages: null,
    AddReactions: null,
    CreatePublicThreads: null,
    CreatePrivateThreads: null,
    SendMessagesInThreads: null
  }, { reason: cleanReason(args.reason, 'Carbon AI admin assistant: unlock channel') });

  return success(`Unlocked #${channel.name} for ${target.name}.`, {
    channel: serializeChannel(channel),
    target: serializeRole(target)
  });
}

async function cloneChannel(context, args) {
  const channel = await resolveChannel(context.guild, args.channel);
  ensureChannelPermissions(channel, context.me, [PermissionFlagsBits.ManageChannels]);
  if (!channel.clone) throw new Error('That channel cannot be cloned.');

  const cloned = await channel.clone({
    name: args.name ? clampString(args.name, 100) : undefined,
    reason: cleanReason(args.reason)
  });

  return success(`Cloned #${channel.name} to #${cloned.name}.`, {
    source: serializeChannel(channel),
    clone: serializeChannel(cloned)
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

async function listRecentMessages(context, args) {
  const limit = Math.min(Math.max(Number(args.limit) || 10, 1), 50);
  const channel = args.channel
    ? await resolveChannel(context.guild, args.channel)
    : context.message.channel;
  if (!channel.messages?.fetch) throw new Error('That channel does not support messages.');
  ensureChannelPermissions(channel, context.me, [PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ViewChannel]);

  const messages = await channel.messages.fetch({ limit });
  return success('Recent messages loaded.', {
    channel: serializeChannel(channel),
    messages: messages.map(serializeMessage)
  });
}

async function fetchMessage(context, args) {
  const resolved = await resolveMessage(context, args);
  ensureChannelPermissions(resolved.channel, context.me, [PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ViewChannel]);

  return success('Message loaded.', {
    channel: serializeChannel(resolved.channel),
    message: serializeMessage(resolved.message)
  });
}

async function editMessage(context, args) {
  const resolved = await resolveMessage(context, args);
  if (resolved.message.author?.id !== context.client.user.id) {
    throw new Error('I can only edit messages that I sent.');
  }

  const edited = await resolved.message.edit({
    content: clampString(args.content, 1900),
    allowedMentions: { parse: [] }
  });

  return success('Message edited.', {
    channel: serializeChannel(resolved.channel),
    message: serializeMessage(edited)
  });
}

async function deleteMessage(context, args) {
  const resolved = await resolveMessage(context, args);
  ensureChannelPermissions(resolved.channel, context.me, [PermissionFlagsBits.ManageMessages]);
  const data = serializeMessage(resolved.message);
  await resolved.message.delete();

  return success('Message deleted.', {
    channel: serializeChannel(resolved.channel),
    message: data
  });
}

async function crosspostMessage(context, args) {
  const resolved = await resolveMessage(context, args, [ChannelType.GuildAnnouncement]);
  ensureChannelPermissions(resolved.channel, context.me, [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages]);
  if (!resolved.message.crosspost) throw new Error('That message cannot be crossposted.');
  const crossposted = await resolved.message.crosspost();

  return success('Message crossposted.', {
    channel: serializeChannel(resolved.channel),
    message: serializeMessage(crossposted)
  });
}

async function addReaction(context, args) {
  const resolved = await resolveMessage(context, args);
  ensureChannelPermissions(resolved.channel, context.me, [PermissionFlagsBits.AddReactions, PermissionFlagsBits.ReadMessageHistory]);
  await resolved.message.react(args.emoji);

  return success('Reaction added.', {
    channel: serializeChannel(resolved.channel),
    message: serializeMessage(resolved.message),
    emoji: args.emoji
  });
}

async function clearReactions(context, args) {
  const resolved = await resolveMessage(context, args);
  ensureChannelPermissions(resolved.channel, context.me, [PermissionFlagsBits.ManageMessages]);
  await resolved.message.reactions.removeAll();

  return success('Reactions cleared.', {
    channel: serializeChannel(resolved.channel),
    message: serializeMessage(resolved.message)
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

async function createThread(context, args) {
  const channel = await resolveChannel(context.guild, args.channel, [ChannelType.GuildText, ChannelType.GuildAnnouncement]);
  const needed = args.private ? PermissionFlagsBits.CreatePrivateThreads : PermissionFlagsBits.CreatePublicThreads;
  ensureChannelPermissions(channel, context.me, [needed, PermissionFlagsBits.SendMessagesInThreads]);

  let thread;
  const options = {
    name: clampString(args.name, 100),
    autoArchiveDuration: args.autoArchiveDuration || 1440,
    rateLimitPerUser: args.slowmodeSeconds,
    reason: cleanReason(args.reason)
  };

  if (args.messageId) {
    const target = await channel.messages.fetch(args.messageId).catch(() => null);
    if (!target) throw new Error(`Could not fetch message ${args.messageId} in #${channel.name}.`);
    thread = await target.startThread(options);
  } else {
    thread = await channel.threads.create({
      ...options,
      type: args.private ? ChannelType.PrivateThread : ChannelType.PublicThread
    });
  }

  return success(`Created thread "${thread.name}".`, {
    thread: serializeChannel(thread)
  });
}

async function editThread(context, args) {
  const thread = await resolveThread(context.guild, args.thread);
  ensureChannelPermissions(thread, context.me, [PermissionFlagsBits.ManageThreads]);

  const payload = {};
  if (args.name !== undefined) payload.name = clampString(args.name, 100);
  if (args.archived !== undefined) payload.archived = Boolean(args.archived);
  if (args.locked !== undefined) payload.locked = Boolean(args.locked);
  if (args.invitable !== undefined) payload.invitable = Boolean(args.invitable);
  if (args.autoArchiveDuration !== undefined) payload.autoArchiveDuration = Number(args.autoArchiveDuration);
  if (args.slowmodeSeconds !== undefined) payload.rateLimitPerUser = Number(args.slowmodeSeconds);
  if (!Object.keys(payload).length) return failure('No thread changes were provided.');

  payload.reason = cleanReason(args.reason);
  const edited = await thread.edit(payload);
  return success(`Edited thread "${edited.name}".`, {
    thread: serializeChannel(edited),
    archived: edited.archived,
    locked: edited.locked
  });
}

async function addThreadMember(context, args) {
  const thread = await resolveThread(context.guild, args.thread);
  const member = await resolveMember(context.guild, args.user);
  await thread.members.add(member.id);

  return success(`Added ${member.user.tag} to thread "${thread.name}".`, {
    thread: serializeChannel(thread),
    member: serializeMember(member)
  });
}

async function removeThreadMember(context, args) {
  const thread = await resolveThread(context.guild, args.thread);
  const member = await resolveMember(context.guild, args.user);
  await thread.members.remove(member.id);

  return success(`Removed ${member.user.tag} from thread "${thread.name}".`, {
    thread: serializeChannel(thread),
    member: serializeMember(member)
  });
}

async function listThreads(context, args) {
  const limit = Math.min(Math.max(Number(args.limit) || 25, 1), 50);
  const active = await context.guild.channels.fetchActiveThreads();
  const threads = active.threads
    .sort((a, b) => b.createdTimestamp - a.createdTimestamp)
    .first(limit)
    .map((thread) => ({
      ...serializeChannel(thread),
      archived: thread.archived,
      locked: thread.locked,
      parentId: thread.parentId,
      memberCount: thread.memberCount,
      messageCount: thread.messageCount
    }));

  return success('Active threads listed.', {
    threads,
    totalActiveThreads: active.threads.size
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

async function listInvites(context, args) {
  const limit = Math.min(Math.max(Number(args.limit) || 25, 1), 50);
  const invites = await context.guild.invites.fetch();

  return success('Invites listed.', {
    invites: invites.first(limit).map(serializeInvite),
    totalInvites: invites.size,
    truncated: invites.size > limit
  });
}

async function deleteInvite(context, args) {
  const code = parseInviteCode(args.invite);
  await context.guild.invites.delete(code, cleanReason(args.reason));

  return success(`Deleted invite ${code}.`, { code });
}

async function listBans(context, args) {
  const limit = Math.min(Math.max(Number(args.limit) || 50, 1), 100);
  const bans = await context.guild.bans.fetch({ limit });

  return success('Bans listed.', {
    bans: bans.map((ban) => ({
      userId: ban.user.id,
      tag: ban.user.tag,
      bot: ban.user.bot,
      reason: ban.reason || null
    })),
    count: bans.size
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

async function listEmojis(context, args) {
  const limit = Math.min(Math.max(Number(args.limit) || 50, 1), 100);
  await context.guild.emojis.fetch().catch(() => null);
  const emojis = context.guild.emojis.cache.first(limit).map((emoji) => ({
    id: emoji.id,
    name: emoji.name,
    animated: emoji.animated,
    managed: emoji.managed,
    available: emoji.available,
    url: emoji.url
  }));

  return success('Emojis listed.', {
    emojis,
    totalEmojis: context.guild.emojis.cache.size,
    truncated: context.guild.emojis.cache.size > limit
  });
}

async function editEmoji(context, args) {
  const emoji = await resolveEmoji(context.guild, args.emoji);
  const edited = await emoji.edit({
    name: clampString(args.name, 32),
    reason: cleanReason(args.reason)
  });

  return success(`Edited emoji :${edited.name}:.`, {
    emoji: { id: edited.id, name: edited.name, url: edited.url }
  });
}

async function deleteEmoji(context, args) {
  const emoji = await resolveEmoji(context.guild, args.emoji);
  const data = { id: emoji.id, name: emoji.name };
  await emoji.delete(cleanReason(args.reason));
  return success(`Deleted emoji :${data.name}:.`, { emoji: data });
}

async function listStickers(context, args) {
  const limit = Math.min(Math.max(Number(args.limit) || 50, 1), 100);
  const stickers = await context.guild.stickers.fetch().catch(() => context.guild.stickers.cache);

  return success('Stickers listed.', {
    stickers: stickers.first(limit).map((sticker) => ({
      id: sticker.id,
      name: sticker.name,
      description: sticker.description,
      tags: sticker.tags,
      available: sticker.available,
      url: sticker.url
    })),
    totalStickers: stickers.size,
    truncated: stickers.size > limit
  });
}

async function deleteSticker(context, args) {
  const sticker = await resolveSticker(context.guild, args.sticker);
  const data = { id: sticker.id, name: sticker.name };
  await sticker.delete(cleanReason(args.reason));

  return success(`Deleted sticker "${data.name}".`, { sticker: data });
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

async function listWebhooks(context, args) {
  const limit = Math.min(Math.max(Number(args.limit) || 50, 1), 100);
  let webhooks;

  if (args.channel) {
    const channel = await resolveChannel(context.guild, args.channel, [ChannelType.GuildText, ChannelType.GuildAnnouncement]);
    ensureChannelPermissions(channel, context.me, [PermissionFlagsBits.ManageWebhooks]);
    webhooks = await channel.fetchWebhooks();
  } else {
    webhooks = await context.guild.fetchWebhooks();
  }

  return success('Webhooks listed.', {
    webhooks: webhooks.first(limit).map(serializeWebhook),
    totalWebhooks: webhooks.size,
    truncated: webhooks.size > limit
  });
}

async function fetchAuditLogs(context, args) {
  const limit = Math.min(Math.max(Number(args.limit) || 10, 1), 25);
  const type = resolveAuditLogEvent(args.action);
  const logs = await context.guild.fetchAuditLogs({ limit, type });

  return success('Audit logs loaded.', {
    entries: logs.entries.map((entry) => ({
      id: entry.id,
      action: entry.action,
      actionType: entry.actionType,
      reason: entry.reason || null,
      executorId: entry.executorId || null,
      targetId: entry.targetId || null,
      createdAt: entry.createdAt?.toISOString() || null,
      changes: entry.changes?.slice(0, 10) || []
    }))
  });
}

async function moveMemberVoice(context, args) {
  const member = await resolveMember(context.guild, args.user);
  const channel = await resolveChannel(context.guild, args.channel, [ChannelType.GuildVoice, ChannelType.GuildStageVoice]);
  if (!member.voice.channel) throw new Error(`${member.user.tag} is not connected to voice.`);
  ensureChannelPermissions(channel, context.me, [PermissionFlagsBits.MoveMembers, PermissionFlagsBits.Connect]);

  await member.voice.setChannel(channel, cleanReason(args.reason));
  return success(`Moved ${member.user.tag} to ${channel.name}.`, {
    member: serializeMember(member),
    channel: serializeChannel(channel)
  });
}

async function disconnectMemberVoice(context, args) {
  const member = await resolveMember(context.guild, args.user);
  if (!member.voice.channel) throw new Error(`${member.user.tag} is not connected to voice.`);
  await member.voice.disconnect(cleanReason(args.reason));

  return success(`Disconnected ${member.user.tag} from voice.`, {
    member: serializeMember(member)
  });
}

async function serverMuteMember(context, args) {
  const member = await resolveMember(context.guild, args.user);
  if (!member.voice.channel) throw new Error(`${member.user.tag} is not connected to voice.`);
  await member.voice.setMute(Boolean(args.muted), cleanReason(args.reason));

  return success(`${Boolean(args.muted) ? 'Muted' : 'Unmuted'} ${member.user.tag} in voice.`, {
    member: serializeMember(member),
    muted: Boolean(args.muted)
  });
}

async function serverDeafenMember(context, args) {
  const member = await resolveMember(context.guild, args.user);
  if (!member.voice.channel) throw new Error(`${member.user.tag} is not connected to voice.`);
  await member.voice.setDeaf(Boolean(args.deafened), cleanReason(args.reason));

  return success(`${Boolean(args.deafened) ? 'Deafened' : 'Undeafened'} ${member.user.tag} in voice.`, {
    member: serializeMember(member),
    deafened: Boolean(args.deafened)
  });
}

function serializeScheduledEvent(event) {
  return {
    id: event.id,
    name: event.name,
    description: event.description || null,
    entityType: event.entityType,
    status: event.status,
    channelId: event.channelId || null,
    creatorId: event.creatorId || null,
    scheduledStartAt: event.scheduledStartAt?.toISOString() || null,
    scheduledEndAt: event.scheduledEndAt?.toISOString() || null,
    userCount: event.userCount || 0,
    location: event.entityMetadata?.location || null,
    url: event.url
  };
}

async function listScheduledEvents(context, args) {
  const limit = Math.min(Math.max(Number(args.limit) || 25, 1), 50);
  const events = await context.guild.scheduledEvents.fetch({ withUserCount: true });

  return success('Scheduled events listed.', {
    events: events.first(limit).map(serializeScheduledEvent),
    totalEvents: events.size,
    truncated: events.size > limit
  });
}

function parseEventEntityType(type) {
  const normalized = String(type || 'external').toLowerCase();
  if (normalized === 'voice') return GuildScheduledEventEntityType.Voice;
  if (normalized === 'stage') return GuildScheduledEventEntityType.StageInstance;
  return GuildScheduledEventEntityType.External;
}

async function createScheduledEvent(context, args) {
  const entityType = parseEventEntityType(args.entityType);
  const start = new Date(args.startTime);
  const end = args.endTime ? new Date(args.endTime) : null;
  if (Number.isNaN(start.getTime())) throw new Error('startTime is not a valid date.');
  if (end && Number.isNaN(end.getTime())) throw new Error('endTime is not a valid date.');

  const payload = {
    name: clampString(args.name, 100),
    description: args.description ? clampString(args.description, 1000) : undefined,
    scheduledStartTime: start,
    scheduledEndTime: end || undefined,
    privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
    entityType,
    reason: cleanReason(args.reason)
  };

  if (entityType === GuildScheduledEventEntityType.External) {
    if (!args.location) throw new Error('External scheduled events need a location.');
    if (!end) throw new Error('External scheduled events need an endTime.');
    payload.entityMetadata = { location: clampString(args.location, 100) };
  } else {
    if (!args.channel) throw new Error('Voice/stage scheduled events need a channel.');
    payload.channel = await resolveChannel(context.guild, args.channel, [ChannelType.GuildVoice, ChannelType.GuildStageVoice]);
  }

  const event = await context.guild.scheduledEvents.create(payload);
  return success(`Created scheduled event "${event.name}".`, {
    event: serializeScheduledEvent(event)
  });
}

async function deleteScheduledEvent(context, args) {
  const event = await resolveScheduledEvent(context.guild, args.event);
  const data = serializeScheduledEvent(event);
  await event.delete(cleanReason(args.reason));

  return success(`Deleted scheduled event "${data.name}".`, {
    event: data
  });
}

function resolveForumTags(channel, tags = []) {
  if (!tags.length) return [];
  const resolved = [];

  for (const tag of tags) {
    const id = extractId(tag);
    const found = channel.availableTags.find((availableTag) => {
      return availableTag.id === id || sameText(availableTag.name, tag);
    });
    if (!found) throw new Error(`Could not find forum tag "${tag}" in #${channel.name}.`);
    resolved.push(found.id);
  }

  return resolved;
}

async function listForumTags(context, args) {
  const channel = await resolveChannel(context.guild, args.channel, [ChannelType.GuildForum]);

  return success('Forum tags listed.', {
    channel: serializeChannel(channel),
    tags: channel.availableTags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      moderated: tag.moderated,
      emojiId: tag.emojiId || null,
      emojiName: tag.emojiName || null
    }))
  });
}

async function createForumPost(context, args) {
  const channel = await resolveChannel(context.guild, args.channel, [ChannelType.GuildForum]);
  ensureChannelPermissions(channel, context.me, [PermissionFlagsBits.SendMessages, PermissionFlagsBits.CreatePublicThreads]);

  const thread = await channel.threads.create({
    name: clampString(args.title, 100),
    message: {
      content: clampString(args.content, 1900),
      allowedMentions: { parse: [] }
    },
    appliedTags: resolveForumTags(channel, args.tags || []),
    reason: cleanReason(args.reason)
  });

  return success(`Created forum post "${thread.name}".`, {
    thread: serializeChannel(thread),
    parent: serializeChannel(channel)
  });
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
  getColorRoleSummary,
  getDetectedColorRoles,
  isMutatingTool,
  summarizeToolCall
};
