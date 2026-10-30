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

Mafia transcripts use five-digit IDs, numbered oldest to newest. Before starting this
version for the first time, you can run `node scripts/import-mafia-transcripts.js` with the
bot stopped and the production `token` and `mongopath` environment variables. The
one-time import reads all Mafia log history, records transcript links in MongoDB,
and sets the next game ID to the historical count plus one. Subsequent runs do not
renumber transcripts or reset the counter. Recovered games use their original
game time when sorting. Deleted transcripts absent from the logs cannot be recovered
by this import.
If the bot's database has not been imported, the first transcript lookup or new
Mafia game imports the Discord log history automatically before proceeding. This
first request may take a few minutes while Discord history is paged.

Use `fh mafiatranscript <number>` in category `824986592653213717` to retrieve a
transcript. Both `1` and `00001` are accepted. The reply warns users not to share
the transcript or its link anywhere. New transcript announcements include the same
ID in the Mafia logs and channel `858295915428315136`.

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
