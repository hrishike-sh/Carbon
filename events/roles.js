const reminder = require('../database/models/timer');
const { Interaction } = require('discord.js');
module.exports = {
  name: 'interactionCreate',
  /**
   * @param {Interaction} button
   */
  async execute(button, client) {
    if (!button.isButton()) return;
    if (
      button.message.id === '883691336144941057' &&
      button.customId === 'ann_ping'
    ) {
      if (button.member.roles.cache.get('826946297151094814')) {
        await button.member.roles.remove('826946297151094814');
        return button.reply({
          content: `I have removed <@&826946297151094814> from you.`,
          ephemeral: true
        });
      } else {
        await button.member.roles.add('826946297151094814');
        return button.reply({
          content: `I have added <@&826946297151094814> to you.`,
          ephemeral: true
        });
      }
    }

    switch (button.customId) {
      case 'ann_ping':
        if (button.member.roles.cache.get('824916329848111114')) {
          await button.member.roles.remove('824916329848111114');
          button.reply({
            content: `I have removed <@&824916329848111114> from you.`,
            ephemeral: true
          });
        } else {
          await button.member.roles.add('824916329848111114');
          button.reply({
            content: `I have added <@&824916329848111114> to you.`,
            ephemeral: true
          });
        }
        break;
      case 'nit_ping':
        if (button.member.roles.cache.get('832066859653398549')) {
          await button.member.roles.remove('832066859653398549');
          button.reply({
            content: `I have removed <@&832066859653398549> from you.`,
            ephemeral: true
          });
        } else {
          await button.member.roles.add('832066859653398549');
          button.reply({
            content: `I have added <@&832066859653398549> to you.`,
            ephemeral: true
          });
        }
        break;
      case 'gaw_ping':
        if (button.member.roles.cache.get('824916330574118942')) {
          await button.member.roles.remove('824916330574118942');
          button.reply({
            content: `I have removed <@&824916330574118942> from you.`,
            ephemeral: true
          });
        } else {
          await button.member.roles.add('824916330574118942');
          button.reply({
            content: `I have added <@&824916330574118942> to you.`,
            ephemeral: true
          });
        }
        break;
      case 'mgaw_ping':
        if (button.member.roles.cache.get('837121985787592704')) {
          await button.member.roles.remove('837121985787592704');
          button.reply({
            content: `I have removed <@&837121985787592704> from you.`,
            ephemeral: true
          });
        } else {
          await button.member.roles.add('837121985787592704');
          button.reply({
            content: `I have added <@&837121985787592704> to you.`,
            ephemeral: true
          });
        }
        break;
      case 'par_ping':
        if (button.member.roles.cache.get('826946297151094814')) {
          await button.member.roles.remove('826946297151094814');
          button.reply({
            content: `I have removed <@&826946297151094814> from you.`,
            ephemeral: true
          });
        } else {
          await button.member.roles.add('826946297151094814');
          button.reply({
            content: `I have added <@&826946297151094814> to you.`,
            ephemeral: true
          });
        }
        break;
      case 'hes_ping':
        if (button.member.roles.cache.get('829283902136254497')) {
          await button.member.roles.remove('829283902136254497');
          button.reply({
            content: `I have removed <@&829283902136254497> from you.`,
            ephemeral: true
          });
        } else {
          await button.member.roles.add('829283902136254497');
          button.reply({
            content: `I have added <@&829283902136254497> to you.`,
            ephemeral: true
          });
        }
        break;
      case 'tou_ping':
        if (button.member.roles.cache.get('824916330905862175')) {
          await button.member.roles.remove('824916330905862175');
          button.reply({
            content: `I have removed <@&824916330905862175> from you.`,
            ephemeral: true
          });
        } else {
          await button.member.roles.add('824916330905862175');
          button.reply({
            content: `I have added <@&824916330905862175> to you.`,
            ephemeral: true
          });
        }
        break;
      case 'eve_ping':
        if (button.member.roles.cache.get('858088201451995137')) {
          await button.member.roles.remove('858088201451995137');
          button.reply({
            content: `I have removed <@&858088201451995137> from you.`,
            ephemeral: true
          });
        } else {
          await button.member.roles.add('858088201451995137');
          button.reply({
            content: `I have added <@&858088201451995137> to you.`,
            ephemeral: true
          });
        }
        break;
      case 'no_par_ping':
        if (button.member.roles.cache.get('838100741121900625')) {
          await button.member.roles.remove('838100741121900625');
          button.reply({
            content: `I have removed <@&838100741121900625> from you.`,
            ephemeral: true
          });
        } else {
          await button.member.roles.add('838100741121900625');
          button.reply({
            content: `I have added <@&838100741121900625> to you.`,
            ephemeral: true
          });
        }
        break;
      case 'par_hes_ping':
        if (button.member.roles.cache.get('824916332230737940')) {
          await button.member.roles.remove('824916332230737940');
          button.reply({
            content: `I have removed <@&824916332230737940> from you.`,
            ephemeral: true
          });
        } else {
          await button.member.roles.add('824916332230737940');
          button.reply({
            content: `I have added <@&824916332230737940> to you.`,
            ephemeral: true
          });
        }
        break;
      case 'nda':
        if (button.member.roles.cache.get('847856832882147378')) {
          await button.member.roles.remove('847856832882147378');
          button.reply({
            content: `I have removed <@&847856832882147378> from you.`,
            ephemeral: true
          });
        } else {
          await button.member.roles.add('847856832882147378');
          button.reply({
            content: `I have added <@&847856832882147378> to you.`,
            ephemeral: true
          });
        }
        break;
      case 'pa':
        if (button.member.roles.cache.get('847857158603145256')) {
          await button.member.roles.remove('847857158603145256');
          button.reply({
            content: `I have removed <@&847857158603145256> from you.`,
            ephemeral: true
          });
        } else {
          await button.member.roles.add('847857158603145256');
          button.reply({
            content: `I have added <@&847857158603145256> to you.`,
            ephemeral: true
          });
        }
        break;
      case 'owo':
        if (button.member.roles.cache.get('847856962016510002')) {
          await button.member.roles.remove('847856962016510002');
          button.reply({
            content: `I have removed <@&847856962016510002> from you.`,
            ephemeral: true
          });
        } else {
          await button.member.roles.add('847856962016510002');
          button.reply({
            content: `I have added <@&847856962016510002> to you.`,
            ephemeral: true
          });
        }
        break;
      case 'mudae':
        if (button.member.roles.cache.get('847857085299163168')) {
          await button.member.roles.remove('847857085299163168');
          button.reply({
            content: `I have removed <@&847857085299163168> from you.`,
            ephemeral: true
          });
        } else {
          await button.member.roles.add('847857085299163168');
          button.reply({
            content: `I have added <@&847857085299163168> to you.`,
            ephemeral: true
          });
        }
        break;
      case 'karuta':
        if (button.member.roles.cache.get('847857003123965982')) {
          await button.member.roles.remove('847857003123965982');
          button.reply({
            content: `I have removed <@&847857003123965982> from you.`,
            ephemeral: true
          });
        } else {
          await button.member.roles.add('847857003123965982');
          button.reply({
            content: `I have added <@&847857003123965982> to you.`,
            ephemeral: true
          });
        }
        break;
      case 'Red':
        if (button.member.roles.cache.get('826052226514288700')) {
          await button.member.roles.remove('826052226514288700');
          button.reply({
            content: `I have removed <@&826052226514288700> from you.`,
            ephemeral: true
          });
        } else {
          await removeRoles(button);
          await button.member.roles.add('826052226514288700');
          button.reply({
            content: `I have added <@&826052226514288700> to you.`,
            ephemeral: true
          });
        }
        break;
      case 'orange':
        if (button.member.roles.cache.get('826044070408617985')) {
          await button.member.roles.remove('826044070408617985');
          button.reply({
            content: `I have removed <@&826044070408617985> from you.`,
            ephemeral: true
          });
        } else {
          await removeRoles(button);
          await button.member.roles.add('826044070408617985');
          button.reply({
            content: `I have added <@&826044070408617985> to you.`,
            ephemeral: true
          });
        }
        break;
      case 'Yellow':
        if (button.member.roles.cache.get('826044013685112888')) {
          await button.member.roles.remove('826044013685112888');
          button.reply({
            content: `I have removed <@&826044013685112888> from you.`,
            ephemeral: true
          });
        } else {
          await removeRoles(button);
          await button.member.roles.add('826044013685112888');
          button.reply({
            content: `I have added <@&826044013685112888> to you.`,
            ephemeral: true
          });
        }
        break;
      case 'Green':
        if (button.member.roles.cache.get('826043999659360267')) {
          await button.member.roles.remove('826043999659360267');
          button.reply({
            content: `I have removed <@&826043999659360267> from you.`,
            ephemeral: true
          });
        } else {
          await removeRoles(button);
          await button.member.roles.add('826043999659360267');
          button.reply({
            content: `I have added <@&826043999659360267> to you.`,
            ephemeral: true
          });
        }
        break;
      case 'blue':
        if (button.member.roles.cache.get('826043885632749568')) {
          await button.member.roles.remove('826043885632749568');
          button.reply({
            content: `I have removed <@&826043885632749568> from you.`,
            ephemeral: true
          });
        } else {
          await removeRoles(button);
          await button.member.roles.add('826043885632749568');
          button.reply({
            content: `I have added <@&826043885632749568> to you.`,
            ephemeral: true
          });
        }
        break;
      case 'purple':
        if (button.member.roles.cache.get('826043828510130186')) {
          await button.member.roles.remove('826043828510130186');
          button.reply({
            content: `I have removed <@&826043828510130186> from you.`,
            ephemeral: true
          });
        } else {
          await removeRoles(button);
          await button.member.roles.add('826043828510130186');
          button.reply({
            content: `I have added <@&826043828510130186> to you.`,
            ephemeral: true
          });
        }
        break;
      case 'pink':
        if (button.member.roles.cache.get('826053767371161610')) {
          await button.member.roles.remove('826053767371161610');
          button.reply({
            content: `I have removed <@&826053767371161610> from you.`,
            ephemeral: true
          });
        } else {
          await removeRoles(button);
          await button.member.roles.add('826053767371161610');
          button.reply({
            content: `I have added <@&826053767371161610> to you.`,
            ephemeral: true
          });
        }
        break;
      case 'black':
        if (button.member.roles.cache.get('826054029431799858')) {
          await button.member.roles.remove('826054029431799858');
          button.reply({
            content: `I have removed <@&826054029431799858> from you.`,
            ephemeral: true
          });
        } else {
          await removeRoles(button);
          await button.member.roles.add('826054029431799858');
          button.reply({
            content: `I have added <@&826054029431799858> to you.`,
            ephemeral: true
          });
        }
        break;
      case 'white':
        if (button.member.roles.cache.get('826053825408139265')) {
          await button.member.roles.remove('826053825408139265');
          button.reply({
            content: `I have removed <@&826053825408139265> from you.`,
            ephemeral: true
          });
        } else {
          await removeRoles(button);
          await button.member.roles.add('826053825408139265');
          button.reply({
            content: `I have added <@&826053825408139265> to you.`,
            ephemeral: true
          });
        }
        break;
      case 'Random':
        if (button.member.roles.cache.get('866675725381140480')) {
          await button.member.roles.remove('866675725381140480');
          button.reply({
            content: `I have removed <@&866675725381140480> from you.`,
            ephemeral: true
          });
        } else {
          await removeRoles(button);
          await button.member.roles.add('866675725381140480');
          button.reply({
            content: `I have added <@&866675725381140480> to you.`,
            ephemeral: true
          });
        }
        break;
      case 'remind_me':
        const timer = await reminder.findOne({
          messageId: button.message.id
        });
        if (!timer) break;
        if (timer.reminders.includes(button.user.id)) {
          timer.reminders = timer.reminders.filter((u) => u !== button.user.id);
          timer.save();
          button.reply({
            content: 'You will no longer be reminded.',
            ephemeral: true
          });
          break;
        }
        timer.reminders.push(button.user.id);
        timer.save();
        button.reply({
          content: `You will be reminded.`,
          ephemeral: true
        });
        break;
    }
  }
}; //
const removeRoles = async (button) => {
  const roles = [
    '826052226514288700',
    '826044070408617985',
    '826044013685112888',
    '826043999659360267',
    '826043885632749568',
    '826043828510130186',
    '826053767371161610',
    '826054029431799858',
    '826053825408139265',
    '866675725381140480'
  ];

  await button.member.roles.remove(roles);
};
