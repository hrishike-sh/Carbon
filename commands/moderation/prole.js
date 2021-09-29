const {
    MessageButton,
    MessageActionRow,
  } = require("discord-buttons")
  
  module.exports = {
      name: 'pingroles',
      aliases: ['proles', 'prole'],
      async execute(message, args){
          if(!message.member.roles.cache.some(role => role.id === '824348974449819658') && message.author.id !== '598918643727990784'){
              message.channel.send("You need the \`・ Administrator\` role to perform this action.")
              return;
          }
  
          const embed = {
              title: '**__SERVER PINGS__**',
              description: '<a:fh_announcement:824918261086945280> • <@&824916329848111114>\n' +
          '<a:fh_Nitroboostrgb:825302229853405184> • <@&832066859653398549>\n' +
          '<a:fh_giveaway:824918033889361941> • <@&824916330574118942>\n' +
          '<a:fh_freemoney:861295940785799168> • <@&837121985787592704>\n' +
          '<a:fh_pepeheist:839495312779640844> • <@&829283902136254497>\n' +
          '<a:fh_pepefight:861294809191677974> • <@&824916330905862175>\n' +
          '<a:fh_bugcatfight:855684995779264542> • <@&858088201451995137>',
          }
          
          const annBut = new MessageButton()
            .setID('ann_ping')
            .setEmoji('824918261086945280')
            .setStyle("grey")
        const nitBut = new MessageButton()
            .setID('nit_ping')
            .setEmoji('825302229853405184')
            .setStyle("grey")
        const gawBut = new MessageButton()
            .setID('gaw_ping')
            .setEmoji('824918033889361941')
            .setStyle("grey")
        const mgawBut = new MessageButton()
            .setID('mgaw_ping')
            .setEmoji('861295940785799168')
            .setStyle("grey")
        const hesBut = new MessageButton()
            .setID('hes_ping')
            .setEmoji('839495312779640844')
            .setStyle("grey")
        const touBut = new MessageButton()
            .setID('tou_ping')
            .setEmoji('861294809191677974')
            .setStyle("grey")
        const eveBut = new MessageButton()
            .setID('eve_ping')
            .setEmoji('855684995779264542')
            .setStyle("grey")

        const row1 = new MessageActionRow().addComponents([annBut, nitBut, gawBut, mgawBut])
        const row2 = new MessageActionRow().addComponents([hesBut, touBut, eveBut])
          
        
          message.channel.send("Get the ping roles here!", {embed, components: [row1, row2]})
      }
  }