# Carbon intents review draft

Use these answers after deploying this revision and restarting Carbon. Add the
public privacy-policy URL and genuine demonstration links before submitting.

## Application details: What does your application do?

Carbon is a multipurpose Discord bot used to manage and support our Discord
community. It provides moderation tools, nickname management, role management,
donation tracking, a virtual coin economy, leaderboards, multiplayer games,
giveaways, and community events.

Members can subscribe to keyword highlights and receive notifications when those
words appear in channels they can access. AFK users can set an absence reason and
receive a summary of messages mentioning them when they return. A last-ping
feature allows eligible members to retrieve recent messages mentioning them.
Administrator-configured keyword rules can automatically react to matching
messages. Carbon also supports Mafia games by processing game messages, tracking
participation, and generating game transcripts. Role-restricted commands display
recently deleted or edited messages, and a reaction-based skullboard reposts
popular messages.

Most commands use the `fh ` prefix, alongside a smaller set of slash commands.
Carbon stores feature settings, Discord identifiers, economy and donation records,
and selected message content needed by its features in MongoDB and host files.
Users can disable optional message tracking with `fh privacy optout`, check their
choice with `fh privacy status`, and enable it again with `fh privacy optin`.

## Public privacy policy

**Yes.** Add your existing public policy URL here: [POLICY URL]. Ensure the policy
describes the storage below, the opt-out, and how to request deletion.

## Requested intents

Server Members and Message Content. Carbon does not use member presence data;
remove Presence from the request if the portal allows it.

## Why do you need the Guild Members intent?

Carbon needs the Guild Members intent for automated moderation triggered by
member joins and nickname changes in our configured community server.

When a member joins, Carbon receives the member-join event and checks the age of
their Discord account. The current server moderation rule automatically removes
non-bot accounts created less than seven days earlier.

Moderators can freeze a member's nickname to an approved value. Carbon listens for
member-update events, detects nickname changes, and restores the configured
nickname for members with an active nickname freeze.

These features must respond to membership events without requiring the affected
member to invoke a command. Application commands alone cannot provide those
automatic event notifications.

## Members: screenshots or videos

[DEMONSTRATION URL] — A moderator runs `fh freezenick @testmember ApprovedName`.
The test member changes their nickname, and Carbon restores the frozen name.
Optionally include a controlled demonstration of the account-age join rule.

## Are you storing any API Data off-platform?

**Yes.** Carbon stores Discord user and server identifiers in MongoDB to associate
members with feature preferences and records, including frozen nicknames, coin
balances, donation records, team membership, and privacy preferences.

## Can users opt out of message content tracking?

**Yes.** Any member can use `fh privacy optout`. This preference persists across
restarts and excludes their messages from highlights and highlight context,
automatic keyword reactions, AFK/last-ping capture, snipe/edit-snipe capture,
skullboard reposts, and new Mafia logs and transcripts. It also disables incoming
AFK/last-ping capture and highlight notifications for that user.

Opting out clears active message-history caches and identifiable stored AFK/last-ping history
associated with the user. Previously delivered notifications, Discord reposts,
exported files, and published transcripts require a separate removal request to
the operator. Explicit commands and game replies are still processed to provide
the functionality the user requests. Manually copied quotations in another
author's messages cannot reliably be attributed to the original author.
Older AFK entries recorded under a previous author tag may require manual removal.

## Are you storing message content off-platform?

**Yes.** MongoDB stores messages mentioning AFK users and recent mention records
for eligible last-ping recipients. Last-ping history is capped at 25 entries per
recipient. AFK records are deleted when the user returns or clears their status.

Carbon writes messages from Mafia channels to host log files and generates hosted
HTML game transcripts containing message content and images. Recently deleted
and edited messages are cached in the bot process, with up to 25 entries of each
type per channel. The message-tracking opt-out applies to future capture and new
transcript exports. Historical exported files are not automatically deleted.

## Will message content be used for model training?

**No.** Message content is not used for model training or fine-tuning.
The conditional explanation field can be left blank.

## Why do you need the Message Content intent?

Carbon needs Message Content access for features that respond to ordinary server
messages without requiring a command or a mention of the bot.

Keyword highlights compare incoming messages against phrases explicitly
subscribed to by users, then send matching-message notifications with context to
subscribers who can view the source channel. Administrator-configured automatic
reactions also depend on matching words or phrases in ordinary messages.

AFK and last-ping features preserve messages mentioning users so those users can
later understand the context of a missed mention. Carbon's Mafia integration
processes game messages and embeds, tracks participation, and generates game
transcripts. Deleted- and edited-message features use message content to display
recent history to permitted users. The skullboard displays messages that reach a
configured reaction threshold.

Carbon also currently parses `fh ` prefix commands and text replies during
interactive games. Application commands could replace individual prefix commands,
but they would not provide ordinary message content needed for keyword matching,
mention context, game-message processing, and message-history features. Users can
disable optional message tracking using `fh privacy optout`.

## Message Content: screenshots or videos

[HIGHLIGHT DEMONSTRATION URL] — Subscribe with `fh hl add reviewdemo`. Send a
matching message from a second account without mentioning Carbon. Show the
resulting highlight notification and its source-channel context.

[OPT-OUT DEMONSTRATION URL] — The second account runs `fh privacy optout`, then
sends another matching message. Show that it produces no highlight notification;
show the persisted preference with `fh privacy status` after a restart.

[OPTIONAL ADDITIONAL URL] — Show an AFK mention summary or a Mafia game transcript
using test messages.

## Before acknowledgement

Check the published privacy policy against the live deployment. Document the
operator's deletion-request contact and actual retention practices for Mafia
files and transcripts; this revision does not add automatic expiry to those
archives. Replace every placeholder with an accessible policy or evidence link.
