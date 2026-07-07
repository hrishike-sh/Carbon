const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const discordTranscripts = require('discord-html-transcripts');

const DEFAULT_PUBLIC_DIR = path.join(os.homedir(), 'transcripts', 'public');
const DEFAULT_BASE_URL = 'https://hrish.site/transcripts';
const ACTION_ROW_TYPE = 1;
const BUTTON_TYPE = 2;
const MAX_BUTTONS_PER_ROW = 5;

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

function componentToJSON(component) {
  if (!component) return component;
  if (typeof component.toJSON === 'function') {
    try {
      return component.toJSON();
    } catch (err) {
      return component;
    }
  }

  return component;
}

function collectButtons(component, output = []) {
  const data = componentToJSON(component);
  if (!data || typeof data !== 'object') return output;

  if (data.type === BUTTON_TYPE) {
    output.push(data);
    return output;
  }

  if (Array.isArray(data.components)) {
    for (const child of data.components) collectButtons(child, output);
  }

  if (data.accessory) collectButtons(data.accessory, output);
  if (Array.isArray(data.items)) {
    for (const item of data.items) collectButtons(item, output);
  }

  return output;
}

function getSafeComponents(message) {
  if (!Array.isArray(message.components)) return [];

  const rows = [];

  for (const component of message.components) {
    const buttons = collectButtons(component);

    for (let i = 0; i < buttons.length; i += MAX_BUTTONS_PER_ROW) {
      rows.push({
        type: ACTION_ROW_TYPE,
        components: buttons.slice(i, i + MAX_BUTTONS_PER_ROW)
      });
    }
  }

  return rows;
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
