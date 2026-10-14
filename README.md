# Carbon

`-` [Carbon bot](https://discord.com/oauth2/authorize?client_id=855652438919872552&scope=bot+applications.commands&guild_id=824294231447044197)

A multipurpose bot having many cool features.

## Setup

Requires Node.js 20.19 or newer and MongoDB.

```sh
npm ci
copy .EXAMPLE.env .env
npm run start
```

Fill in the required Discord token and MongoDB connection values in `.env` before starting. Optional API keys enable the commands that use those external services.

Use `npm run deploy` to register guild slash commands. Both startup and deployment reject malformed command modules instead of silently loading a partial set.

## Development checks

```sh
npm run check
npm test
npm audit --omit=dev
```

`check` validates JavaScript in `src`, `scripts`, and `tests`, then loads and validates command/event exports without logging into Discord. `test` runs offline regression tests using Node's built-in test runner and mocked Discord/database calls; it needs no credentials or running MongoDB.

Commands intentionally kept inactive export `{ disabled: true }`. This includes the unfinished `imposters` game, whose original round loop could freeze the bot. Other inactive legacy prototypes remain disabled.

Startup validates `token` and `mongopath`, loads feature caches before connecting to Discord, and closes managed timers, Discord, and MongoDB on SIGINT/SIGTERM. Interactive games remain in memory and do not resume after a restart.

Coin balance reads do not create accounts. Account creation is serialized within one process, and failed transfer credits attempt to refund the sender. Transfers are still not crash-atomic: multi-process economy writers need a duplicate-account migration, unique user indexes, and transactions or a durable ledger. Existing records are not merged automatically. Multi-team SummerFight updates also remain a separate consistency improvement.

## Recover Mafia transcripts from raw logs

```sh
node scripts/export-mafia-log.js src/logs/mafia-raw/mafia-2026-09-19.jsonl transcripts-export
```

Open `transcripts-export/index.html`. The offline exporter creates one Discord-style
HTML page per channel using `discord-html-transcripts-v2`, restoring shared fields
from the raw logger's top-level copies. It needs no bot token or live Discord
channel. Message times are rendered in UTC. Images still use external URLs;
edits, deletions, and guild role styling are not recoverable from this log.
Keep the generated pages and raw logs out of Git.

# Main Contributors

`-` Hrishikesh

⤷ [Discord](https://discordapp.com/users/598918643727990784)

⤷ [GitHub](https://github.com/HrishikeshS123)

`-` Dauntless

⤷ [Discord](https://discordapp.com/users/266432078222983169)

⤷ [GitHub](https://github.com/Dauntless7)

`-` Fellintron

⤷ [Discord](https://discordapp.com/users/786150805773746197)

⤷ [GitHub](https://github.com/Fellintron)
