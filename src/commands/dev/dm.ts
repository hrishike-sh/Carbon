import { EmbedBuilder, Message, Client, User } from 'discord.js';
import { prefix } from '../../../tsconfig.json';

const fh = '824294231447044197';
const admin = '1016728636365209631';

export default {
  name: 'dm',
  description: 'Sends a DM to a user as FightHub Staff',
  usage: `${prefix}dm <user> [message] [-a for anonymous]`,

  async execute(message: Message, args: string[], client: Client) {
    if (message.guild?.id !== fh) {
      return message.reply({
        content: 'This command can only be used in the FightHub server.'
      });
    }

    if (!message.member?.roles.cache.has(admin)) {
      return message.reply({
        content: 'Only Community Managers+ can use this command.'
      });
    }

    const user =
      message.mentions.users.first() ||
      (await client.users.fetch(args[0]).catch(() => null));

    if (!user) {
      return message.reply({
        content: 'Please mention a user or provide a valid user ID.'
      });
    }

    args.shift();
    let content = args.join(' ');
    const anonymous = content.includes('-a');

    if (anonymous) {
      content = content.replace('-a', '').trim();
    }

    if (!content) {
      return message.reply({ content: 'Please provide a message to send.' });
    }

    const embed = new EmbedBuilder()
      .setTitle('You have received a message from FightHub Staff!')
      .setDescription(`**Message:** ${content}`)
      .setColor('#FF0000')
      .setTimestamp();

    if (!anonymous) {
      embed.setAuthor({
        name: message.author.tag,
        iconURL: message.author.displayAvatarURL()
      });
    }

    try {
      await user.send({ embeds: [embed] });
      await message.react('✅');
    } catch (error) {
      console.error('DM Error:', error);
      await message.reply({
        content: `Failed to send DM to ${user.tag}. They may have DMs disabled.`
      });
    }
  }
};
