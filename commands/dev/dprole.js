
const {
  MessageButton,
  MessageActionRow
} = require('discord-buttons')

module.exports = {
  name: 'test',
  async execute(message, args){
    const but1 = new MessageButton()
      .setStyle('blurple')
      .setEmoji('826944020394934334', true)
      .setLabel("")
      .setID('red')
    const but2 = new MessageButton()
      .setStyle('blurple')
      .setEmoji('826944020566507580', true)
      .setLabel("")
      .setID('orange')
    const but3 = new MessageButton()
      .setStyle('blurple')
      .setEmoji('826944020499660801', true)
      .setLabel("")
      .setID('yellow')
    const but4 = new MessageButton()
      .setStyle('blurple')
      .setEmoji('826944020629815337', true)
      .setLabel("")
      .setID('green')
    const but5 = new MessageButton()
      .setStyle('blurple')
      .setEmoji('826944020529807360', true)
      .setLabel("")
      .setID('blue')
    const but6 = new MessageButton()
      .setStyle('blurple')
      .setEmoji('826944020285882399', true)
      .setLabel("")
      .setID('purple')
    const but7 = new MessageButton()
      .setStyle('blurple')
      .setEmoji('826944020554973194', true)
      .setLabel("")
      .setID('pink')
    const but8 = new MessageButton()
      .setStyle('blurple')
      .setEmoji('826944020491272202', true)
      .setLabel("")
      .setID('black')
    const but9 = new MessageButton()
      .setStyle('blurple')
      .setEmoji('826944020155465749', true)
      .setLabel("")
      .setID('white')
    const but10 = new MessageButton()
      .setStyle('blurple')
      .setEmoji('847995364148510771', true)
      .setLabel("")
      .setID('random')

    const row = new MessageActionRow().addComponents([but1, but2, but3, but4, but5])
    const row2 = new MessageActionRow().addComponents([but6, but7, but8, but9, but10])
   const msg = await message.channel.send({ embed: {
     title: "**__COLOR ROLES__**",
     description: `<a:fh_redflame:826944020394934334> • <@&826052226514288700>
<a:fh_orangeflame:826944020566507580> • <@&826044070408617985>
<a:fh_yellowflame:826944020499660801> • <@&826044013685112888>
<a:fh_greenflame:826944020629815337> • <@&826043999659360267>
<a:fh_blueflame:826944020529807360> • <@&826043885632749568>
<a:fh_purpleflame:826944020285882399> • <@&826043828510130186>
<a:fh_pinkflame:826944020554973194> • <@&826053767371161610>
<a:fh_blackflame:826944020491272202> • <@&826054029431799858>
<a:fh_whiteflame:826944020155465749> • <@&826053825408139265>
<a:fh_pensiverainbow:847995364148510771> • <@&866675725381140480>`
   }, components: [row, row2]})
  }
}