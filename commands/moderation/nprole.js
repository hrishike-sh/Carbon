const {
    MessageButton,
    MessageActionRow,
  } = require("discord-buttons")
  
  module.exports = {
      name: 'nop',
      aliases: ['noping', 'nopings'],
      description: 'you dont need to know',
    fhOnly: true,
      async execute(message, args){
          if(!message.member.roles.cache.some(role => role.id === '824348974449819658') && message.author.id !== '598918643727990784'){
              message.channel.send("You need the \`・ Administrator\` role to perform this action.")
              return;
          }
  
          const embed = {
            title: '**__PARTNER PINGS__**',
            description: '<a:fh_partner:861299771612594196> • <@&826946297151094814>\n' +
              '<a:fh_nono:824904307337723905> • <@&838100741121900625>\n' +
              '<:fh_pandaheist:861300228803002368> • <@&824916332230737940>',
          }
          
        const annBut = new MessageButton()
            .setID('par_ping')
            .setEmoji('861299771612594196')
            .setStyle("grey")
        const nitBut = new MessageButton()
            .setID('no_par_ping')
            .setEmoji('824904307337723905')
            .setStyle("grey")
        const gawBut = new MessageButton()
            .setID('par_hes_ping')
            .setEmoji('861300228803002368')
            .setStyle("grey")
        

        const row1 = new MessageActionRow().addComponents([annBut, nitBut, gawBut])
          
        
          message.channel.send("Get the ping roles here!", {embed, components: [row1]})
      }
  }