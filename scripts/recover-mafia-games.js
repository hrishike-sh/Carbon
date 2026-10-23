// Usage: node scripts/recover-mafia-games.js [--post] [--count=10] [--logs=/path]
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { createReadStream } = require('node:fs');
const { createInterface } = require('node:readline');
const { spawnSync } = require('node:child_process');
const { REST, Routes } = require('discord.js');
const root = path.resolve(__dirname, '..');
require('dotenv').config({ path: [path.join(root, 'src/.env'), path.join(root, '.env')], quiet: true });
const config = require('../src/config');

function textOf(node) {
  if (!node || typeof node !== 'object') return '';
  if (Array.isArray(node)) return node.map(textOf).join('\n');
  return [node.content, node.title, node.description, node.name, node.value,
    textOf(node.components), textOf(node.items), textOf(node.fields), textOf(node.footer)]
    .filter(value => typeof value === 'string').join('\n');
}

async function main() {
  const args = process.argv.slice(2);
  const option = (name, fallback) => args.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3) || fallback;
  const count = Number(option('count', '10'));
  if (!Number.isInteger(count) || count < 1 || count > 100) throw new Error('Count must be 1–100.');
  const logs = option('logs', path.join(root, 'src/logs/mafia-raw'));
  const files = (await fs.readdir(logs)).filter(name => /^mafia-\d{4}-\d{2}-\d{2}\.jsonl$/.test(name)).sort();
  const channels = new Map();
  for (const file of files) {
    let lineNumber = 0;
    for await (const line of createInterface({ input: createReadStream(path.join(logs, file)), crlfDelay: Infinity })) {
      lineNumber++;
      if (!line.trim()) continue;
      let entry;
      try { entry = JSON.parse(line); }
      catch { throw new Error(`Invalid JSON in ${file}:${lineNumber}. Retry after the active log finishes writing.`); }
      if (entry.event !== 'MESSAGE_CREATE' || entry.guildId !== config.ids.guildId) continue;
      if (!channels.has(entry.channelId)) channels.set(entry.channelId, new Map());
      channels.get(entry.channelId).set(entry.messageId, entry);
    }
  }
  const games = [];
  for (const entries of channels.values()) {
    let pending = [];
    for (const entry of [...entries.values()].sort((a, b) => BigInt(a.messageId) < BigInt(b.messageId) ? -1 : 1)) {
      pending.push(entry);
      if (!config.ids.mafiaBotIds.includes(entry.authorId)) continue;
      const text = [entry.content, textOf(entry.embeds), textOf(entry.raw?.d?.components)].join('\n');
      if (/\bgame\s+over\b|thanks for playing/i.test(text)) {
        games.push({ endId: entry.messageId, channelId: entry.channelId, end: entry.receivedAt, entries: pending });
        pending = [];
      }
    }
  }
  const latest = games.sort((a, b) => BigInt(a.endId) > BigInt(b.endId) ? -1 : 1).slice(0, count).reverse();
  if (!latest.length) throw new Error('No completed Mafia games found in the saved logs.');
  console.log(`Found ${games.length} completed games; selected ${latest.length}. Captures may start mid-game.`);
  for (const game of latest) console.log(`${game.end} | ${game.channelId} | ${game.entries.length} messages`);
  if (!args.includes('--post')) { console.log('Preview only. Add --post to generate hosted pages and post links.'); return; }
  if (!process.env.token) throw new Error('Missing token in src/.env, .env, or environment.');
  const publicDir = process.env.transcriptPublicDir || path.join(os.homedir(), 'transcripts/public');
  const baseUrl = (process.env.transcriptBaseUrl || 'https://hrish.site/transcripts').replace(/\/+$/, '');
  const stateDir = path.join(root, 'logs');
  const statePath = path.join(stateDir, 'mafia-recovery-posted.json');
  let posted;
  try { posted = JSON.parse(await fs.readFile(statePath, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; posted = {}; }
  const rest = new REST({ version: '10' }).setToken(process.env.token);
  const target = await rest.get(Routes.channel(config.ids.channels.mafiaLog));
  if (target.guild_id !== config.ids.guildId) throw new Error('Mafia log channel belongs to another guild.');
  await fs.mkdir(publicDir, { recursive: true });
  await fs.mkdir(stateDir, { recursive: true });
  const work = await fs.mkdtemp(path.join(os.tmpdir(), 'carbon-mafia-recovery-'));
  try {
    for (const game of latest) {
      if (posted[game.endId]) { console.log(`Already posted ${game.endId}; skipping.`); continue; }
      const input = path.join(work, 'game.jsonl');
      await fs.writeFile(input, game.entries.map(entry => JSON.stringify(entry)).join('\n'));
      const result = spawnSync(process.execPath, [path.join(__dirname, 'export-mafia-log.js'), input, work], { encoding: 'utf8', timeout: 180000 });
      if (result.error || result.status !== 0) throw new Error(result.error?.message || result.stderr || 'Export failed');
      const filename = `mafia-recovered-${game.channelId}-${game.endId}.html`;
      await fs.copyFile(path.join(work, `mafia-${game.channelId}.html`), path.join(publicDir, filename));
      const url = `${baseUrl}/${filename}`;
      const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error(`Hosted page returned HTTP ${response.status}: ${url}. No link posted for this game.`);
      const message = await rest.post(Routes.channelMessages(target.id), { body: {
        content: `Recovered Mafia transcript • ended ${game.end}\n${game.entries.length} captured messages (capture may be partial).\n${url}`,
        allowed_mentions: { parse: [] }
      } });
      posted[game.endId] = { messageId: message.id, url };
      await fs.writeFile(`${statePath}.tmp`, JSON.stringify(posted, null, 2));
      await fs.rename(`${statePath}.tmp`, statePath);
      console.log(`Posted ${url}`);
    }
  } finally { await fs.rm(work, { recursive: true, force: true }); }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
