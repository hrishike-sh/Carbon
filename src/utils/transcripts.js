const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const discordTranscripts = require('discord-html-transcripts');

const DEFAULT_PUBLIC_DIR = path.join(os.homedir(), 'transcripts', 'public');
const DEFAULT_BASE_URL = 'https://hrish.dev/transcripts';

function getTranscriptConfig() {
  const publicDir = process.env.transcriptPublicDir || DEFAULT_PUBLIC_DIR;
  const baseUrl = (process.env.transcriptBaseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');

  return { publicDir, baseUrl };
}

function sanitizeNamePart(value) {
  return String(value || '')
    .replace(/[^a-z0-9_-]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function getSafeComponents(message) {
  if (!Array.isArray(message.components)) return [];

  return message.components
    .map((row) => {
      const data = typeof row?.toJSON === 'function' ? row.toJSON() : row;
      if (!Array.isArray(data?.components)) return null;

      return {
        ...data,
        components: data.components.filter((component) => component?.type)
      };
    })
    .filter((row) => row?.components.length);
}

function getSafeMessage(message) {
  const safeComponents = getSafeComponents(message);

  return new Proxy(message, {
    get(target, prop, receiver) {
      if (prop === 'components') return safeComponents;
      return Reflect.get(target, prop, receiver);
    },
    getOwnPropertyDescriptor(target, prop) {
      if (prop === 'components') {
        return { configurable: true, enumerable: true, writable: true, value: safeComponents };
      }
      return Reflect.getOwnPropertyDescriptor(target, prop);
    },
    ownKeys(target) {
      return Reflect.ownKeys(target);
    }
  });
}

function getSafeMessages(messages) {
  const list = Array.isArray(messages) ? messages : [...messages.values()];
  return list.map(getSafeMessage);
}

async function createHostedTranscript(channel, messages, options = {}) {
  if (!channel) throw new Error('Missing transcript channel.');
  if (!messages || messages.length === 0 || messages.size === 0) {
    throw new Error('No messages available for transcript.');
  }

  const { publicDir, baseUrl } = getTranscriptConfig();
  const prefix = sanitizeNamePart(options.prefix || 'transcript');
  const channelPart = sanitizeNamePart(channel.id || channel.name || 'channel');
  const fileName = `${prefix}-${channelPart}-${Date.now()}.html`;
  const filePath = path.join(publicDir, fileName);
  const safeMessages = getSafeMessages(messages);

  const html = await discordTranscripts.generateFromMessages(safeMessages, channel, {
    returnType: 'buffer',
    saveImages: true,
    poweredBy: false
  });

  await fs.mkdir(publicDir, { recursive: true });
  await fs.writeFile(filePath, html);

  return {
    fileName,
    filePath,
    url: `${baseUrl}/${fileName}`
  };
}

module.exports = {
  createHostedTranscript
};
