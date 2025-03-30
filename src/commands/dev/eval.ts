import { inspect } from 'util';
import axios from 'axios';
import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Message,
  Client,
  ChannelType,
  APIButtonComponentWithURL
} from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const devs = [
  '598918643727990784',
  '786150805773746197',
  '434613993253109760',
  '721368467789578332',
  '694265424077914243'
];
const LOG_CHANNEL_ID = '897100501148127272';

async function uploadToPastesDev(content: string): Promise<string> {
  try {
    const response = await axios.post(
      'https://pastes.dev/api/v1/pastes',
      {
        content,
        language: 'javascript',
        expiration: '1week'
      },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
    return `https://pastes.dev/${response.data.id}`;
  } catch (error) {
    console.error('Pastes.dev upload failed:', error);
    return 'https://pastes.dev/error';
  }
}

export default {
  name: 'eval',
  aliases: ['e'],
  category: 'Developer',
  description: 'Evaluates arbitrary JavaScript code',
  ownerOnly: true,

  async execute(message: Message, args: string[], client: Client) {
    if (!devs.includes(message.author.id)) {
      return message.reply({
        content: '❌ This command is restricted to developers only.'
      });
    }

    let input = args.join(' ');
    if (input.match(/^```(js)?([\s\S]*?)```$/)) {
      input = input.replace(/^```(js)?\n?/, '').replace(/\n?```$/, '');
    }

    if (!input) {
      return message.reply({ content: 'Please provide code to evaluate.' });
    }

    let result: string;
    try {
      const evaled = await eval(
        input.includes('await') ? `(async()=>{${input}})()` : input
      );
      result =
        typeof evaled === 'string' ? evaled : inspect(evaled, { depth: 1 });
    } catch (error) {
      result = error instanceof Error ? error.message : String(error);
    }

    // Sanitize output
    if (process.env.TOKEN) {
      result = result.replace(
        new RegExp(process.env.TOKEN, 'gi'),
        '[REDACTED]'
      );
    }

    const components: ActionRowBuilder<ButtonBuilder>[] = [];
    if (result.length > 1000) {
      const pasteUrl = await uploadToPastesDev(result);
      if (result.length > 1024) {
        result = 'Output too long - view full result via button below';
      } else {
        result = `${result.slice(0, 1000)}...`;
      }

      const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('View Full Output')
          .setStyle(ButtonStyle.Link)
          .setURL(pasteUrl)
      );
      components.push(buttonRow);
    }

    const embed = new EmbedBuilder()
      .setTitle('Evaluation Result')
      .setColor(0x00ff00)
      .addFields(
        { name: '📥 Input', value: `\`\`\`js\n${input}\n\`\`\`` },
        { name: '📤 Output', value: `\`\`\`js\n${result}\n\`\`\`` }
      );

    await message.reply({
      embeds: [embed],
      components
    });

    const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
    if (logChannel?.type === ChannelType.GuildText) {
      await logChannel.send({
        content: `${message.author.tag} (${message.author.id}) executed eval:`,
        embeds: [embed],
        components
      });
    }
  }
};
