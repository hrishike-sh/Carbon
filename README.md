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

Use `npm run deploy` to register guild slash commands, and `npm run check` to validate all JavaScript source files.

## Retired team event

The old attack, block, shield, lootbox, and lootbox-grant commands (including aliases) and automatic seasonal games are disabled. Manual `fh events` games remain available without team rewards. `fh tlb` now shows a general Team Leaderboard, and team displays show points and membership.

To clear old teams, use the live deployment's `mongopath` environment variable or root `.env`. First preview, then stop the bot and apply:

```sh
node scripts/reset-teams.js
node scripts/reset-teams.js --apply
```

The script backs up complete team documents as BSON Extended JSON under the Git-ignored `logs/team-backups/` directory before deleting the captured IDs. It clears memberships, scores, and event inventories with those teams; it does not modify coin balances or other collections. Keep the backup private. Deploy this code and restart the bot to disable the old commands and scheduler. The reset is explicit and never runs automatically on startup.

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
