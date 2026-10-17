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

Coin balance reads do not create accounts. Account creation is serialized within one process, and failed transfer credits attempt to refund the sender. Transfers are still not crash-atomic: multi-process economy writers need a duplicate-account migration, unique user indexes, and transactions or a durable ledger. Existing records are not merged automatically.

## Retired team event

The old attack, block, shield, lootbox, and lootbox-grant commands (including aliases) and automatic seasonal games are disabled. Manual `fh events` games remain available without team rewards. `fh tlb` now shows a general Team Leaderboard, and team displays show points and membership.

To clear old teams, use the live deployment's `mongopath` environment variable or root `.env`. First preview, then stop the bot and apply:

```sh
node scripts/reset-teams.js
node scripts/reset-teams.js --apply
```

The script backs up complete team documents as BSON Extended JSON under the Git-ignored `logs/team-backups/` directory before deleting the captured IDs. It clears memberships, scores, and event inventories with those teams; it does not modify coin balances or other collections. Keep the backup private. Deploy this code and restart the bot to disable the old commands and scheduler. The reset is explicit and never runs automatically on startup.

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
