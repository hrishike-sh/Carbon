# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Project

Carbon — multipurpose Discord bot built with discord.js v14. Uses MongoDB (Mongoose) for persistence. Prefix `fh ` configured in `src/config.json`. Single-guild deployment (guildId: `824294231447044197`).

## Commands

```sh
node src/index.js          # Start the bot
node src/deploy-commands.js # Register slash commands with Discord
```

No build step. No test suite. Plain Node.js — run directly.

## Environment

Copy `.EXAMPLE.env` to `.env` and fill in:

| Variable   | Purpose              |
| ---------- | -------------------- |
| `token`    | Discord bot token    |
| `mongopath`| MongoDB connection   |
| `amariToken`| Amari API token     |

## Architecture

### Command system

Two parallel systems:

- **Text commands** (`src/commands/`) — prefix-based (`fh <name>`). Each file exports `{ name, aliases?, cooldown?, roles?, execute(message, args, client) }`. Loaded in `src/index.js` via `fs.readdirSync` on startup into `client.cmd.commands` Collection.
- **Slash commands** (`src/slash-commands/`) — registered via `src/deploy-commands.js` (guild-scoped, not global). Each file exports `{ data: SlashCommandBuilder, execute(interaction, client) }`. Loaded into `client.cmd.slashCommands` Collection.

### Event system

`src/events/` — each file exports `{ name, once?, execute(...args, client) }`. Auto-loaded in `src/index.js` loop. Standard discord.js event names (e.g. `messageCreate`, `ClientReady`). Some events are game/feature systems (mafia, coin-events, skullboard) loaded as raw event listeners.

### Database layer

`src/database/` — Mongoose schemas/models. Flat files, no service layer. Each file exports a model. Key schemas:

- `coins.js` — user coin balances
- `settingsSchema.js` — guild settings (donation roles, snipe config, lockdown state, etc.)
- `main_dono.js`, `grinder_dono.js` — donation tracking
- `afk.js`, `highlight.js`, `lastping.js` — user feature data

`src/database/handler/Main.js` — wrapper class for donation queries (not used for all DB access).

### Entry point flow (`src/index.js`)

1. Creates discord.js Client with Guilds, Messages, MessageContent, Members, Reactions intents + Reaction/Message partials
2. On `ClientReady`: sets status, initializes `client.db.afks`, loads highlight module, runs shard broadcast to leave small guilds
3. Connects Mongoose
4. Loads text commands from `./commands/` subdirectories into `client.cmd.commands`
5. Loads slash commands from `./slash-commands/` subdirectories into `client.cmd.slashCommands`
6. Handles `InteractionCreate` for slash command dispatch
7. Handles `MessageCreate` for prefix command dispatch (cooldowns, role checks, anti-bot captcha)
8. Loads event files from `./events/`

### Anti-bot system

`client.antiBot(message)` — when a user sends 25+ messages, triggers a button captcha. Failure wipes all coins and DMs the bot owner. Called per-command (not globally enforced).

### Coin economy

Random events trigger on ~3% of messages in the main guild (`coin-events.js`): heists (join-button, 25% fail chance losing 10% coins) and math quizzes (first correct answer gets 100-200 coins). Commands under `src/commands/currency/` handle gambling, shop, transfers, etc.
