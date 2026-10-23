const fs = require('node:fs/promises');
const path = require('node:path');
const { Client, Guild, TextChannel, Message } = require('discord.js');
const { generateFromMessages } = require('discord-html-transcripts-v2');
process.env.TZ = 'UTC';

// Restore shared values replaced by the raw logger's circular-reference guard.
function restoreEntry(entry) {
  const data = { ...entry.raw?.d };
  for (const [key, saved] of Object.entries({
    embeds: entry.embeds, attachments: entry.attachments, mentions: entry.mentions,
    mention_roles: entry.mentionRoles, referenced_message: entry.referencedMessage
  })) {
    if (data[key] === '[Circular]' || data[key] === undefined) data[key] = saved;
  }
  // A mention's member.user may point back to the containing mention.
  return JSON.parse(JSON.stringify(data), (key, value) => value === '[Circular]' ? undefined : value);
}

async function main() {
  const [, , input, destination = 'transcripts-export'] = process.argv;
  if (!input) throw new Error('Usage: node scripts/export-mafia-log.js <log.jsonl> [output-directory]');
  const lines = (await fs.readFile(input, 'utf8')).split(/\r?\n/);
  const entries = lines.flatMap((line, index) => {
    if (!line.trim()) return [];
    try { return [JSON.parse(line)]; }
    catch { throw new Error(`Invalid JSON on line ${index + 1}; no transcript written.`); }
  });
  const client = new Client({ intents: [] });
  // Export is offline: never log in, fetch users, or access deleted channels.
  client.rest.request = async () => { throw new Error('Network access disabled for log export'); };
  const groups = new Map();
  for (const entry of entries) {
    if (entry.event !== 'MESSAGE_CREATE') continue;
    const data = restoreEntry(entry);
    if (!data.id || !data.channel_id || !data.guild_id || !data.author?.id) {
      throw new Error(`Incomplete message ${entry.messageId || '(unknown)'}`);
    }
    const key = `${data.guild_id}-${data.channel_id}`;
    if (!groups.has(key)) groups.set(key, new Map());
    groups.get(key).set(data.id, data);
  }
  if (!groups.size) throw new Error('No MESSAGE_CREATE records found.');
  const output = path.resolve(destination);
  await fs.mkdir(output, { recursive: true });
  const summaries = [];
  try {
    for (const records of groups.values()) {
      const data = [...records.values()].sort((a, b) => BigInt(a.id) < BigInt(b.id) ? -1 : 1);
      const guild = new Guild(client, { id: data[0].guild_id, name: 'Mafia archive', roles: [{ id: data[0].guild_id, name: '@everyone', permissions: '0', position: 0, colors: { primary_color: 0, secondary_color: null, tertiary_color: null } }], emojis: [], stickers: [] });
      client.guilds.cache.set(guild.id, guild);
      const channel = new TextChannel(guild, { id: data[0].channel_id, name: 'mafia', type: 0 }, client);
      guild.channels.cache.set(channel.id, channel);
      client.channels.cache.set(channel.id, channel);
      const messages = data.map(packet => new Message(client, packet));
      const html = await generateFromMessages(messages, channel, {
        returnType: 'string', saveImages: false, poweredBy: false, hydrate: true,
        callbacks: {
          resolveUser: async id => client.users.cache.get(id) || null,
          resolveChannel: async id => client.channels.cache.get(id) || null,
          resolveRole: async () => null
        },
        footerText: 'Recovered {number} message{s} from the raw log. Times shown in UTC. Edits and deletions were not captured.'
      });
      const filename = `mafia-${channel.id}.html`;
      const styledHtml = html.replace('</head>', '<style>html,body{background:#313338;color:#dbdee1}discord-messages{display:block;width:100%;box-sizing:border-box}discord-message{color:#dbdee1}.discord-author-username{color:#f2f3f5!important}</style></head>');
      await fs.writeFile(path.join(output, filename), styledHtml);
      summaries.push({ filename, messages: messages.length, start: messages[0].createdAt.toISOString(), end: messages.at(-1).createdAt.toISOString() });
    }
    const links = summaries.map(s => `<li><a href="${s.filename}">#mafia · ${s.start.slice(0, 16).replace('T', ' ')} UTC</a><p>${s.messages} messages · through ${s.end}</p></li>`).join('\n');
    await fs.writeFile(path.join(output, 'index.html'), `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mafia transcripts</title><style>body{background:#313338;color:#eee;font:16px system-ui;max-width:850px;margin:60px auto;padding:24px}a{color:#91b7ff}li{padding:20px;background:#2b2d31;margin:16px 0;border-radius:12px}p{color:#bbb}ul{list-style:none;padding:0}</style><h1>Mafia transcripts</h1><p>Recovered from the saved Discord message log. External images require internet access.</p><ul>${links}</ul></html>`);
    console.log(JSON.stringify({ output, channels: summaries }, null, 2));
  } finally { await client.destroy(); }
}

main().catch(error => { console.error(error.stack); process.exitCode = 1; });
