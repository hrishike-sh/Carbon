const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ComponentType,
  PermissionFlagsBits
} = require('discord.js');
const { createChatCompletion } = require('../../utils/deepseek');
const {
  TOOL_DEFINITIONS,
  executeTool,
  getColorRoleSummary,
  isMutatingTool,
  summarizeToolCall
} = require('../../utils/carbonAdminTools');
const { infoEmbed, warningEmbed, errorEmbed, successEmbed } = require('../../utils/embeds');

const activeSessions = new Map();
const AWAIT_MARKER = '[[await_user]]';
const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const MAX_MODEL_STEPS_PER_TURN = 20;
const MAX_USER_TURNS = 30;

function splitMessage(content) {
  const chunks = [];
  const text = String(content || '').trim();
  if (!text) return chunks;

  for (let i = 0; i < text.length; i += 1900) {
    chunks.push(text.slice(i, i + 1900));
  }
  return chunks;
}

function sessionKey(session) {
  return `${session.guild.id}:${session.channel.id}:${session.author.id}`;
}

function createSessionMessage(baseMessage, channel) {
  return {
    guild: baseMessage.guild,
    channel,
    author: baseMessage.author,
    member: baseMessage.member,
    originalMessage: baseMessage
  };
}

function makeThreadName(prompt) {
  const compact = String(prompt || 'AI admin help')
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s#@-]/g, '')
    .trim();
  return `carbon-${compact || 'assistant'}`.slice(0, 90);
}

function makeSystemPrompt() {
  return [
    'You are Carbon, a Discord administration assistant inside a discord.js bot.',
    'You help administrators with Discord server tasks by asking for missing details and using the provided tools.',
    'The human invoking you already passed an Administrator permission check, but tools still enforce Discord bot permissions and role hierarchy.',
    'Never claim that an action happened until a tool result says ok=true.',
    'Use tools only when the requested action and required details are clear.',
    'If details are missing, ask one concise follow-up question and end the message with [[await_user]].',
    'Do not add [[await_user]] when your response is final.',
    'Mutating tool calls are automatically confirmed by the bot, so do not ask for a separate confirmation unless the user request itself is ambiguous.',
    'Color roles means self-assignable or aesthetic roles named after colors like red, orange, yellow, green, blue, purple, pink, black, white, gray, teal, etc. Do not treat every role with a non-default Discord color as a color role.',
    'If the user asks to put a role above color roles, use create_role with positionAboveColorRoles=true for new roles or set_role_position with aboveColorRoles=true for existing roles. Do not ask what color roles means.',
    'If the user asks for a random role name or random color, either choose one yourself or pass "random" to the role tool.',
    'For dangerous permission audits, use list_members_with_permissions or list_roles_with_permissions. Do not call get_member_info on role names like Owner, Admin, Staff, or labels from role lists.',
    'For broad "who/what/how many" server questions, prefer read-only list/audit tools first, then summarize counts and the most relevant entries.',
    'If no available tool can satisfy a Discord admin request, call get_eval_context, then call run_reviewed_eval with JavaScript code. This is a last resort.',
    'run_reviewed_eval is developer-only and requires a visible button confirmation before execution. After it runs, use its output to answer the user.',
    'Never use run_reviewed_eval for tasks that an existing built-in tool can handle. Keep eval code short, targeted, and easy to review.',
    'Prefer IDs and mentions when users provide them. If a name may be ambiguous, use list/read tools or ask for a mention/ID.',
    'Mentions in messages sent through tools are disabled by default. Warn the user if they want real pings.',
    'You cannot bypass Discord limitations, bot permissions, owner-only settings, 2FA requirements, role hierarchy, or API limits.',
    'Keep replies short, practical, and Discord-native.'
  ].join('\n');
}

function makeContextMessage(session) {
  return [
    `Guild: ${session.guild.name} (${session.guild.id})`,
    `Command channel: #${session.originalMessage.channel.name} (${session.originalMessage.channel.id})`,
    `Assistant thread: #${session.channel.name} (${session.channel.id})`,
    `Invoker: ${session.author.tag} (${session.author.id})`,
    `Invoker display name: ${session.member.displayName}`,
    `Available tool count: ${TOOL_DEFINITIONS.length}`,
    '',
    'Detected color roles:',
    getColorRoleSummary(session.guild)
  ].join('\n');
}

async function createAssistantThread(message, prompt) {
  if (message.channel.isThread()) return message.channel;

  if (![ChannelType.GuildText, ChannelType.GuildAnnouncement].includes(message.channel.type)) {
    const err = new Error('Carbon can only create assistant threads from text or announcement channels.');
    err.code = 'THREAD_CREATE_FAILED';
    throw err;
  }

  try {
    return await message.startThread({
      name: makeThreadName(prompt),
      autoArchiveDuration: 60,
      reason: 'Carbon AI assistant session'
    });
  } catch (err) {
    const wrapped = new Error(`I could not create a thread for Carbon: ${err.message}`);
    wrapped.code = 'THREAD_CREATE_FAILED';
    throw wrapped;
  }
}

async function sendAssistantText(session, content) {
  const clean = String(content || '').replace(AWAIT_MARKER, '').trim();
  if (!clean) return;

  const chunks = splitMessage(clean);
  for (const chunk of chunks) {
    await session.channel.send({
      embeds: [infoEmbed({ description: chunk })],
      allowedMentions: { parse: [] }
    });
  }
}

async function awaitUserReply(session, timeout = IDLE_TIMEOUT_MS) {
  const filter = (m) => (
    m.author.id === session.author.id &&
    m.channel.id === session.channel.id &&
    !m.author.bot &&
    m.content.trim().length > 0
  );
  const collected = await session.channel.awaitMessages({
    filter,
    max: 1,
    time: timeout,
    errors: ['time']
  }).catch(() => null);

  if (!collected) {
    const err = new Error('Session idle timeout.');
    err.code = 'SESSION_IDLE_TIMEOUT';
    throw err;
  }

  const reply = collected.first();
  let content = reply.content.trim();
  content = content.replace(/^fh\s+carbon\s*/i, '').trim() || content;

  if (/^(cancel|stop|nevermind|never mind|end)$/i.test(content)) {
    const err = new Error('Session cancelled.');
    err.code = 'SESSION_CANCELLED';
    throw err;
  }

  return content;
}

async function confirmToolCall(session, name, args) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('carbon_confirm')
      .setLabel('Confirm')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('carbon_cancel')
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Danger)
  );

  const description = name === 'run_reviewed_eval'
    ? [
        `Purpose: ${args.purpose || 'No purpose provided.'}`,
        '',
        'Carbon wants to run this reviewed eval code:',
        '```js',
        String(args.code || '').slice(0, 3000),
        '```'
      ].join('\n')
    : `Carbon wants to run:\n\`\`\`json\n${summarizeToolCall(name, args)}\n\`\`\``;

  const prompt = await session.channel.send({
    embeds: [
      warningEmbed({
        title: 'Confirm Discord action',
        description,
        footer: 'Only the command caller can confirm this.'
      })
    ],
    components: [row],
    allowedMentions: { parse: [] }
  });

  try {
    const interaction = await prompt.awaitMessageComponent({
      componentType: ComponentType.Button,
      time: 60000,
      filter: (i) => i.user.id === session.author.id
    });

    const confirmed = interaction.customId === 'carbon_confirm';
    const disabled = new ActionRowBuilder().addComponents(
      row.components.map((component) => ButtonBuilder.from(component).setDisabled(true))
    );

    await interaction.update({
      components: [disabled],
      embeds: [
        confirmed
          ? successEmbed({ title: 'Confirmed', description: 'Running the Discord action now.' })
          : warningEmbed({ title: 'Cancelled', description: 'That action was not run.' })
      ]
    });

    return confirmed;
  } catch (err) {
    const disabled = new ActionRowBuilder().addComponents(
      row.components.map((component) => ButtonBuilder.from(component).setDisabled(true))
    );
    await prompt.edit({
      components: [disabled],
      embeds: [warningEmbed({ title: 'Timed out', description: 'That action was not run.' })]
    }).catch(() => {});
    return false;
  }
}

function parseToolArgs(toolCall) {
  const raw = toolCall.function?.arguments || '{}';
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch (err) {
    return {};
  }
}

async function runToolCall(session, client, toolCall) {
  const name = toolCall.function?.name;
  const args = parseToolArgs(toolCall);

  if (!name) {
    return { ok: false, message: 'Tool call was missing a function name.' };
  }

  if (isMutatingTool(name)) {
    const confirmed = await confirmToolCall(session, name, args);
    if (!confirmed) {
      return { ok: false, cancelled: true, message: 'The user cancelled or did not confirm this action.' };
    }
  }

  await session.channel.sendTyping().catch(() => {});

  return executeTool({
    client,
    guild: session.guild,
    message: session,
    me: session.guild.members.me
  }, name, args);
}

async function processModelTurn(session, client, messages) {
  for (let step = 0; step < MAX_MODEL_STEPS_PER_TURN; step++) {
    await session.channel.sendTyping().catch(() => {});
    const assistantMessage = await createChatCompletion({
      messages,
      tools: TOOL_DEFINITIONS,
      toolChoice: 'auto',
      temperature: 0.15
    });

    if (!assistantMessage) {
      throw new Error('DeepSeek returned an empty response.');
    }

    const toolCalls = assistantMessage.tool_calls || [];
    messages.push({
      role: 'assistant',
      content: assistantMessage.content || '',
      tool_calls: toolCalls.length ? toolCalls : undefined
    });

    if (!toolCalls.length) {
      await sendAssistantText(session, assistantMessage.content);
      return;
    }

    for (const toolCall of toolCalls) {
      const result = await runToolCall(session, client, toolCall);
      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result)
      });
    }
  }

  await session.channel.send({
    embeds: [
      warningEmbed({
        description: 'I hit my internal tool-call limit while working on that. Reply with a more specific next step and I can keep going here.'
      })
    ]
  });
}

async function runSession(baseMessage, thread, initialPrompt, client) {
  const session = createSessionMessage(baseMessage, thread);
  const messages = [
    { role: 'system', content: makeSystemPrompt() },
    { role: 'user', content: `Runtime context:\n${makeContextMessage(session)}\n\nUser request:\n${initialPrompt}` }
  ];

  let userTurns = 1;
  await processModelTurn(session, client, messages);

  while (userTurns < MAX_USER_TURNS) {
    const reply = await awaitUserReply(session);
    userTurns++;
    messages.push({ role: 'user', content: reply });
    await processModelTurn(session, client, messages);
  }

  await session.channel.send({
    embeds: [
      warningEmbed({
        description: 'Carbon reached the message limit for this assistant thread. Start a new `fh carbon` thread if you need more.'
      })
    ]
  });
}

module.exports = {
  name: 'carbon',
  aliases: ['ai', 'assistant'],
  cooldown: 5,
  async execute(message, args, client) {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.reply({
        embeds: [errorEmbed({ description: 'You must have Administrator permission to use Carbon AI admin tools.' })]
      });
    }

    if (!message.guild.members.me) {
      await message.guild.members.fetchMe().catch(() => null);
    }

    const prompt = args.join(' ').trim();
    if (!prompt) {
      return message.reply({
        embeds: [
          infoEmbed({
            title: 'Carbon AI',
            description: 'Ask me to help with Discord admin tasks.\nExample: `fh carbon create a muted role and lock it out of #general`'
          })
        ]
      });
    }

    let thread;
    try {
      thread = await createAssistantThread(message, prompt);
    } catch (err) {
      return message.reply({
        embeds: [errorEmbed({ description: err.message })]
      });
    }

    const session = createSessionMessage(message, thread);
    const key = sessionKey(session);
    if (activeSessions.has(key)) {
      return thread.send({
        embeds: [warningEmbed({ description: 'You already have a Carbon assistant session running in this thread. Reply here or type `cancel`.' })]
      });
    }

    activeSessions.set(key, true);

    (async () => {
      try {
        await thread.send({
          embeds: [
            infoEmbed({
              description: 'Carbon thread opened. Reply here without `fh carbon`; type `cancel` to end the session.'
            })
          ],
          allowedMentions: { parse: [] }
        });
        await runSession(message, thread, prompt, client);
      } catch (err) {
        if (err.code === 'SESSION_CANCELLED') {
          await thread.send({
            embeds: [warningEmbed({ description: 'Carbon session cancelled.' })]
          });
        } else if (err.code === 'SESSION_IDLE_TIMEOUT') {
          await thread.send({
            embeds: [warningEmbed({ description: 'Carbon session closed after 15 minutes with no messages.' })]
          });
        } else if (err.code === 'MISSING_DEEPSEEK_API_KEY') {
          await thread.send({
            embeds: [errorEmbed({ description: 'Missing `deepseekApiKey` in `.env`. Add it and restart the bot.' })]
          });
        } else {
          await thread.send({
            embeds: [errorEmbed({ description: `Carbon hit an error: ${err.message}` })]
          });
        }
      } finally {
        activeSessions.delete(key);
      }
    })().catch(() => {
      activeSessions.delete(key);
    });
  }
};
