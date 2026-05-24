const { EmbedBuilder } = require('discord.js');

const Theme = {
  info: 0x5865f2,
  success: 0x57f287,
  warning: 0xfee75c,
  error: 0xed4245,
  neutral: 0x2b2d31
};

const BOT_NAME = 'Carbon';

function resolveColor(color) {
  if (color === undefined || color === null) return Theme.neutral;
  if (typeof color === 'number') return color;
  const key = color.toLowerCase();
  if (Theme[key]) return Theme[key];
  return color;
}

function footer(text) {
  return { text: `${BOT_NAME} • ${text}` };
}

function createEmbed(opts = {}) {
  const embed = new EmbedBuilder().setColor(resolveColor(opts.color));

  if (opts.title) embed.setTitle(opts.title);
  if (opts.description) embed.setDescription(opts.description);
  if (opts.url) embed.setURL(opts.url);
  if (opts.author) embed.setAuthor(opts.author);
  if (opts.thumbnail) embed.setThumbnail(opts.thumbnail);
  if (opts.image) embed.setImage(opts.image);
  if (opts.fields) embed.addFields(opts.fields);
  if (opts.timestamp) embed.setTimestamp();

  if (opts.footer) {
    embed.setFooter(typeof opts.footer === 'string' ? footer(opts.footer) : opts.footer);
  }

  return embed;
}

function infoEmbed(opts) {
  return createEmbed({ ...opts, color: Theme.info });
}
function successEmbed(opts) {
  return createEmbed({ ...opts, color: Theme.success });
}
function warningEmbed(opts) {
  return createEmbed({ ...opts, color: Theme.warning });
}
function errorEmbed(opts) {
  return createEmbed({ ...opts, color: Theme.error });
}
function neutralEmbed(opts) {
  return createEmbed({ ...opts, color: Theme.neutral });
}

async function replyError(target, description, opts = {}) {
  const embed = errorEmbed({ description });
  if (opts.title) embed.setTitle(opts.title);
  if (opts.footer) embed.setFooter(typeof opts.footer === 'string' ? footer(opts.footer) : opts.footer);
  const payload = { embeds: [embed] };
  if (opts.ephemeral) payload.ephemeral = true;
  return target.reply(payload).catch(() => {});
}

async function replySuccess(target, description, opts = {}) {
  const embed = successEmbed({ description });
  if (opts.title) embed.setTitle(opts.title);
  if (opts.footer) embed.setFooter(typeof opts.footer === 'string' ? footer(opts.footer) : opts.footer);
  const payload = { embeds: [embed] };
  if (opts.ephemeral) payload.ephemeral = true;
  return target.reply(payload).catch(() => {});
}

async function replyWarning(target, description, opts = {}) {
  const embed = warningEmbed({ description });
  if (opts.title) embed.setTitle(opts.title);
  if (opts.footer) embed.setFooter(typeof opts.footer === 'string' ? footer(opts.footer) : opts.footer);
  const payload = { embeds: [embed] };
  if (opts.ephemeral) payload.ephemeral = true;
  return target.reply(payload).catch(() => {});
}

async function sendError(channel, description, opts = {}) {
  const embed = errorEmbed({ description, ...opts });
  return channel.send({ embeds: [embed] }).catch(() => {});
}

async function sendSuccess(channel, description, opts = {}) {
  const embed = successEmbed({ description, ...opts });
  return channel.send({ embeds: [embed] }).catch(() => {});
}

module.exports = {
  Theme,
  BOT_NAME,
  resolveColor,
  footer,
  createEmbed,
  infoEmbed,
  successEmbed,
  warningEmbed,
  errorEmbed,
  neutralEmbed,
  replyError,
  replySuccess,
  replyWarning,
  sendError,
  sendSuccess
};
