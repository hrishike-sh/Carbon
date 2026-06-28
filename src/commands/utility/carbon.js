const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  PermissionFlagsBits
} = require('discord.js');
const { createChatCompletion } = require('../../utils/deepseek');
const {
  TOOL_DEFINITIONS,
  executeTool,
  isMutatingTool,
  summarizeToolCall
} = require('../../utils/carbonAdminTools');
const { infoEmbed, warningEmbed, errorEmbed, successEmbed } = require('../../utils/embeds');

const activeSessions = new Map();
const AWAIT_MARKER = '[[await_user]]';

function splitMessage(content) {
  const chunks = [];
  const text = String(content || '').trim();
  if (!text) return chunks;

  for (let i = 0; i < text.length; i += 1900) {
    chunks.push(text.slice(i, i + 1900));
  }
  return chunks;
}

function sessionKey(message) {
  return `${message.guild.id}:${message.channel.id}:${message.author.id}`;
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
    'Prefer IDs and mentions when users provide them. If a name may be ambiguous, use list/read tools or ask for a mention/ID.',
    'Mentions in messages sent through tools are disabled by default. Warn the user if they want real pings.',
    'You cannot bypass Discord limitations, bot permissions, owner-only settings, 2FA requirements, role hierarchy, or API limits.',
    'Keep replies short, practical, and Discord-native.'
  ].join('\n');
}

function makeContextMessage(message) {
  return [
    `Guild: ${message.guild.name} (${message.guild.id})`,
    `Current channel: #${message.channel.name} (${message.channel.id})`,
    `Invoker: ${message.author.tag} (${message.author.id})`,
    `Invoker display name: ${message.member.displayName}`,
    `Available tool count: ${TOOL_DEFINITIONS.length}`
  ].join('\n');
}

async function sendAssistantText(message, content) {
  const clean = String(content || '').replace(AWAIT_MARKER, '').trim();
  if (!clean) return;

  const chunks = splitMessage(clean);
  for (const chunk of chunks) {
    await message.channel.send({
      embeds: [infoEmbed({ description: chunk })],
      allowedMentions: { parse: [] }
    });
  }
}

async function awaitUserReply(message) {
  const filter = (m) => m.author.id === message.author.id && m.channel.id === message.channel.id;
  const collected = await message.channel.awaitMessages({
    filter,
    max: 1,
    time: 180000,
    errors: ['time']
  });

  const reply = collected.first();
  const content = reply.content.trim();
  if (/^(cancel|stop|nevermind|never mind)$/i.test(content)) {
    const err = new Error('Session cancelled.');
    err.code = 'SESSION_CANCELLED';
    throw err;
  }

  return content;
}

async function confirmToolCall(message, name, args) {
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

  const prompt = await message.channel.send({
    embeds: [
      warningEmbed({
        title: 'Confirm Discord action',
        description: `Carbon wants to run:\n\`\`\`json\n${summarizeToolCall(name, args)}\n\`\`\``,
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
      filter: (i) => i.user.id === message.author.id
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

async function runToolCall(message, client, toolCall) {
  const name = toolCall.function?.name;
  const args = parseToolArgs(toolCall);

  if (!name) {
    return { ok: false, message: 'Tool call was missing a function name.' };
  }

  if (isMutatingTool(name)) {
    const confirmed = await confirmToolCall(message, name, args);
    if (!confirmed) {
      return { ok: false, cancelled: true, message: 'The user cancelled or did not confirm this action.' };
    }
  }

  await message.channel.sendTyping().catch(() => {});

  return executeTool({
    client,
    guild: message.guild,
    message,
    me: message.guild.members.me
  }, name, args);
}

async function runSession(message, initialPrompt, client) {
  const messages = [
    { role: 'system', content: makeSystemPrompt() },
    { role: 'user', content: `Runtime context:\n${makeContextMessage(message)}\n\nUser request:\n${initialPrompt}` }
  ];

  let aiCalls = 0;
  let userTurns = 0;

  while (aiCalls < 10 && userTurns < 8) {
    await message.channel.sendTyping().catch(() => {});
    const assistantMessage = await createChatCompletion({
      messages,
      tools: TOOL_DEFINITIONS,
      toolChoice: 'auto',
      temperature: 0.15
    });
    aiCalls++;

    if (!assistantMessage) {
      throw new Error('DeepSeek returned an empty response.');
    }

    const toolCalls = assistantMessage.tool_calls || [];
    messages.push({
      role: 'assistant',
      content: assistantMessage.content || '',
      tool_calls: toolCalls.length ? toolCalls : undefined
    });

    if (assistantMessage.content && !toolCalls.length) {
      const waitingForUser = assistantMessage.content.includes(AWAIT_MARKER);
      await sendAssistantText(message, assistantMessage.content);

      if (!waitingForUser) return;

      const reply = await awaitUserReply(message);
      userTurns++;
      messages.push({ role: 'user', content: reply });
      continue;
    }

    if (!toolCalls.length) return;

    for (const toolCall of toolCalls) {
      const result = await runToolCall(message, client, toolCall);
      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result)
      });
    }
  }

  await message.reply({
    embeds: [
      warningEmbed({
        description: 'This got a little long, so I stopped the assistant session. Run `fh carbon` again to continue with a fresh request.'
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

    const key = sessionKey(message);
    if (activeSessions.has(key)) {
      return message.reply({
        embeds: [warningEmbed({ description: 'You already have a Carbon assistant session running in this channel. Reply there or type `cancel`.' })]
      });
    }

    activeSessions.set(key, true);

    try {
      await message.reply({
        embeds: [infoEmbed({ description: 'Carbon is thinking...' })],
        allowedMentions: { parse: [] }
      });
      await runSession(message, prompt, client);
    } catch (err) {
      if (err.code === 'SESSION_CANCELLED') {
        await message.channel.send({
          embeds: [warningEmbed({ description: 'Carbon session cancelled.' })]
        });
      } else if (err.code === 'MISSING_DEEPSEEK_API_KEY') {
        await message.channel.send({
          embeds: [errorEmbed({ description: 'Missing `deepseekApiKey` in `.env`. Add it and restart the bot.' })]
        });
      } else {
        await message.channel.send({
          embeds: [errorEmbed({ description: `Carbon hit an error: ${err.message}` })]
        });
      }
    } finally {
      activeSessions.delete(key);
    }
  }
};
