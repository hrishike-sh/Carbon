const axios = require('axios');

const DEFAULT_MODEL = 'deepseek-chat';
const DEFAULT_BASE_URL = 'https://api.deepseek.com';

function getDeepSeekConfig() {
  const apiKey = process.env.deepseekApiKey || process.env.DEEPSEEK_API_KEY;
  const model = process.env.deepseekModel || process.env.DEEPSEEK_MODEL || DEFAULT_MODEL;
  const baseURL = (process.env.deepseekBaseUrl || process.env.DEEPSEEK_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');

  return { apiKey, model, baseURL };
}

async function createChatCompletion({ messages, tools, toolChoice = 'auto', temperature = 0.2 }) {
  const { apiKey, model, baseURL } = getDeepSeekConfig();

  if (!apiKey) {
    const err = new Error('Missing deepseekApiKey in .env.');
    err.code = 'MISSING_DEEPSEEK_API_KEY';
    throw err;
  }

  let res;
  try {
    res = await axios.post(
      `${baseURL}/chat/completions`,
      {
        model,
        messages,
        tools,
        tool_choice: toolChoice,
        temperature
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 45000
      }
    );
  } catch (err) {
    const apiMessage = err.response?.data?.error?.message || err.response?.data?.message;
    if (apiMessage) {
      throw new Error(`DeepSeek API error: ${apiMessage}`);
    }
    throw err;
  }

  return res.data.choices?.[0]?.message;
}

module.exports = { createChatCompletion };
