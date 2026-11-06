# Carbon Privacy Policy

Last updated: October 30, 2026

Carbon is a Discord bot operated by its maintainers. This policy explains how
Carbon handles information when it operates in a Discord server, responds to
commands, or creates game transcripts.

For privacy questions, corrections, access requests, or deletion requests,
contact **@hrishikesh on Discord**.

## Information Carbon handles

Carbon receives information through Discord's interfaces and information you
provide when using its features. Depending on the feature, this includes:

- **Discord account and server information:** user, server, channel, role, and
  message identifiers; usernames, display names, avatars, nicknames, membership,
  roles, permissions, and account creation dates.
- **Messages and related information:** message text, timestamps, mentions, links,
  embeds, attachments, images, and message references. Some features also handle
  the previous text of edited messages or recently deleted messages.
- **Preferences and information you submit:** highlight keywords, AFK reasons,
  timezones, nickname settings, automatic reaction rules, and privacy choices.
- **Feature records:** virtual coin balances, donation totals recorded by the
  server, leaderboard entries, team membership, game participation, giveaway
  information, and scheduled actions.
- **Operational information:** command names and usage counts, activity counts,
  moderation information supplied through server tools, and diagnostic messages
  generated while operating the bot.

Carbon does not request access to members' online status or activities. Carbon
does not ask for your Discord password, account token, or payment card details.
Donation records track server-recorded amounts and associated identifiers;
Carbon does not process payment card transactions.

## How information is used

Carbon uses information to carry out commands, run community games and events,
maintain economy and donation records, deliver notifications, apply server
moderation settings, and diagnose problems.

For example, Carbon checks account creation dates when applying the server's
new-account join rule. It uses nickname updates to enforce moderator-configured
nickname freezes. It checks message text for subscribed highlight keywords and
automatic reaction rules. It stores selected mentions so users can retrieve
missed pings or AFK summaries.

Carbon also uses message information for recently deleted or edited message
history, reaction-based skullboard reposts, and Mafia participation logs and
transcripts. Some of these features act on ordinary messages without requiring
the author to run a command.

We do not sell personal information or use Discord data for advertising.
Message content is not used for model training or fine-tuning.

## Storage and retention

Carbon stores information outside Discord in a MongoDB database, in the running
bot's memory, and in files on its hosting system. Mafia transcripts are exported
as HTML and can include saved images.

| Information | Retention behavior |
| --- | --- |
| Recent mention history | Up to 25 records per eligible recipient; older records are replaced as new ones arrive. Records do not have a fixed time-based expiry. |
| AFK information and mention summaries | Kept while the AFK record exists. Clearing AFK status deletes that record; returning normally clears it while the AFK message handler is active. |
| Recently deleted and edited messages | Up to 25 entries of each type per channel in memory. They are replaced by newer entries or cleared when the bot process restarts. |
| Mafia message logs and hosted transcripts | Stored as files without automatic expiry. Removal requires manual action by the operator. |
| Preferences, economy records, donation records, team records, settings, and command statistics | Kept to provide the corresponding features. Most have no automatic expiry. |
| Message-tracking opt-out | Stored against your Discord user ID so Carbon can remember your choice after restarts. |

We remove information when it is no longer needed for the purposes described in
this policy, when we stop operating Carbon, or following a verified deletion
request, except where retention is required by law. Removing a message on Discord
does not automatically remove copies already stored by Carbon or exported in a
transcript.

## Who can see information

Information may be disclosed through the feature you use. Examples include
leaderboards, timezone lookups, AFK notices, moderation responses, and game
summaries displayed in Discord. Highlight notifications include matching text
and nearby context and are sent to subscribers who can view the source channel.
AFK and last-ping features display stored mention information to their recipients.
Certain message-history and administration commands have role or permission
restrictions.

Skullboard reposts and Mafia transcripts create additional copies of messages.
Hosted transcript links may be accessible to people outside the original Discord
channel, including anyone who receives the link. Original Discord channel
permissions should not be assumed to protect an exported transcript.

The operator and people authorized to maintain Carbon may access stored data to
operate the service, resolve problems, or fulfill privacy requests. Hosting and
database providers process information as needed to provide those services.
Discord processes information under its own
[Privacy Policy](https://discord.com/privacy).

Some commands use external services to fetch game words, dictionary definitions,
images, or other requested information. For example, dictionary lookups send the
word being queried to a dictionary service. Developer troubleshooting tools can
upload long diagnostic outputs to an external paste service; such outputs may
contain information returned by the diagnostic operation. Third-party services
handle information they receive under their own policies. We may also disclose
information where required by law.

## Your message-tracking choices

You can use these commands in a server where Carbon is available:

- `fh privacy optout` disables optional message tracking for your account.
- `fh privacy status` shows your saved choice.
- `fh privacy optin` enables optional message tracking again.

Opting out excludes your messages from new highlight matches and highlight
context, automatic keyword reactions, AFK and last-ping capture, deleted- and
edited-message capture, skullboard reposts, and new Mafia logs and transcript
exports. It also stops incoming AFK/last-ping capture and highlight notifications
for your account. The choice persists across bot restarts.

Opting out clears active snipe and Mafia message caches associated with you and
attempts to clear identifiable stored AFK and last-ping history. If database
cleanup fails, Carbon tells you to retry or contact the operator. Older AFK
entries stored under a previous username or tag may need manual removal.

Opting out does not stop Discord from delivering messages to the bot. Carbon
still processes commands and game replies you intentionally submit, and the
choice does not delete economy, donation, team, or moderation records. It does
not automatically remove notifications already delivered, Discord reposts,
existing log files, or published transcripts. Text manually quoted by another
user cannot reliably be attributed to its original author.

You can remove individual highlight subscriptions with `fh hl remove <keyword>`
and a saved timezone with `fh time clear`. Server administrators can restrict
Carbon's channel access or remove the bot from their server.

## Access, correction, and deletion requests

Contact **@hrishikesh on Discord** to request access to, correction of, or deletion
of information Carbon holds about you. Include your Discord user ID and, where
relevant, message links, transcript URLs, the server involved, or your previous
username or tag. Do not send passwords or account tokens.

We may ask you to verify control of the Discord account concerned. We will
review requests promptly and fulfill them as required by applicable law and
Discord's developer requirements. Depending on where you live, you may also have
rights to object to or restrict processing, request a portable copy of your
information, or complain to your local data protection authority.

Deleting Carbon's records does not delete other people's independent copies or
Discord's own records. We can remove copies under our control and help identify
other copies that require a separate request. If you want to remain opted out,
tell us so we can retain the minimal user ID and preference needed to honor that
choice. Deleting that preference means Carbon can no longer remember the opt-out.

## Security

Carbon uses Discord permissions and command access checks to restrict certain
features. These controls do not make hosted transcripts private. Avoid putting
passwords, financial details, or other sensitive information into bot commands
or game channels. Contact the privacy contact above if you believe Carbon has
exposed information improperly, or if you need details about its hosting,
storage locations, backups, or security practices.

## Age requirements

Carbon is intended for people who meet Discord's minimum age requirements in
their country. If you believe Carbon holds information about someone below that
age, contact us so we can investigate and remove it where appropriate.

## Changes to this policy

We will update this policy when Carbon's information practices change and revise
the date above. Material changes will be announced through Carbon's support or
server announcements, as appropriate. For questions about this policy, contact
**@hrishikesh on Discord**.
