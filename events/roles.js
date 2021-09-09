module.exports = {
  name: 'clickButton',
  async execute(button, client){
    
    if(button.message.id === '883691336144941057' && button.id === 'ann_ping'){
      if(button.clicker.member.roles.cache.get("826946297151094814")){
         await button.clicker.member.roles.remove("826946297151094814")
         return button.reply.send(`I have removed <@&826946297151094814> from you.`, true)
       } else {
         await button.clicker.member.roles.add("826946297151094814")
         return button.reply.send(`I have added <@&826946297151094814> to you.`, true)
       }
    }
    if(button.message.id === '883696224732065822'){
      
    }
    switch(button.id){
      case 'ann_ping':
       if(button.clicker.member.roles.cache.get("824916329848111114")){
         await button.clicker.member.roles.remove("824916329848111114")
         button.reply.send(`I have removed <@&824916329848111114> from you.`, true)
       } else {
         await button.clicker.member.roles.add("824916329848111114")
         button.reply.send(`I have added <@&824916329848111114> to you.`, true)
       }
        break;
      case 'nit_ping':
       if(button.clicker.member.roles.cache.get("832066859653398549")){
         await button.clicker.member.roles.remove("832066859653398549")
         button.reply.send(`I have removed <@&832066859653398549> from you.`, true)
       } else {
         await button.clicker.member.roles.add("832066859653398549")
         button.reply.send(`I have added <@&832066859653398549> to you.`, true)
       }
        break;
      case 'gaw_ping':
       if(button.clicker.member.roles.cache.get("824916330574118942")){
         await button.clicker.member.roles.remove("824916330574118942")
         button.reply.send(`I have removed <@&824916330574118942> from you.`, true)
       } else {
         await button.clicker.member.roles.add("824916330574118942")
         button.reply.send(`I have added <@&824916330574118942> to you.`, true)
       }
        break;
      case 'mgaw_ping':
       if(button.clicker.member.roles.cache.get("837121985787592704")){
         await button.clicker.member.roles.remove("837121985787592704")
         button.reply.send(`I have removed <@&837121985787592704> from you.`, true)
       } else {
         await button.clicker.member.roles.add("837121985787592704")
         button.reply.send(`I have added <@&837121985787592704> to you.`, true)
       }
        break;
      case 'hes_ping':
       if(button.clicker.member.roles.cache.get("829283902136254497")){
         await button.clicker.member.roles.remove("829283902136254497")
         button.reply.send(`I have removed <@&829283902136254497> from you.`, true)
       } else {
         await button.clicker.member.roles.add("829283902136254497")
         button.reply.send(`I have added <@&829283902136254497> to you.`, true)
       }
        break;
      case 'tou_ping':
       if(button.clicker.member.roles.cache.get("824916330905862175")){
         await button.clicker.member.roles.remove("824916330905862175")
         button.reply.send(`I have removed <@&824916330905862175> from you.`, true)
       } else {
         await button.clicker.member.roles.add("824916330905862175")
         button.reply.send(`I have added <@&824916330905862175> to you.`, true)
       }
        break;
      case 'eve_ping':
       if(button.clicker.member.roles.cache.get("858088201451995137")){
         await button.clicker.member.roles.remove("858088201451995137")
         button.reply.send(`I have removed <@&858088201451995137> from you.`, true)
       } else {
         await button.clicker.member.roles.add("858088201451995137")
         button.reply.send(`I have added <@&858088201451995137> to you.`, true)
       }
        break;
      case 'no_par_ping':
       if(button.clicker.member.roles.cache.get("838100741121900625")){
         await button.clicker.member.roles.remove("838100741121900625")
         button.reply.send(`I have removed <@&838100741121900625> from you.`, true)
       } else {
         await button.clicker.member.roles.add("838100741121900625")
         button.reply.send(`I have added <@&838100741121900625> to you.`, true)
       }
        break;
      case 'par_hes_ping':
       if(button.clicker.member.roles.cache.get("824916332230737940")){
         await button.clicker.member.roles.remove("824916332230737940")
         button.reply.send(`I have removed <@&824916332230737940> from you.`, true)
       } else {
         await button.clicker.member.roles.add("824916332230737940")
         button.reply.send(`I have added <@&824916332230737940> to you.`, true)
       }
        break;
      case 'nda':
       if(button.clicker.member.roles.cache.get("847856832882147378")){
         await button.clicker.member.roles.remove("847856832882147378")
         button.reply.send(`I have removed <@&847856832882147378> from you.`, true)
       } else {
         await button.clicker.member.roles.add("847856832882147378")
         button.reply.send(`I have added <@&847856832882147378> to you.`, true)
       }
        break;
      case 'pa':
       if(button.clicker.member.roles.cache.get("847857158603145256")){
         await button.clicker.member.roles.remove("847857158603145256")
         button.reply.send(`I have removed <@&847857158603145256> from you.`, true)
       } else {
         await button.clicker.member.roles.add("847857158603145256")
         button.reply.send(`I have added <@&847857158603145256> to you.`, true)
       }
        break;
      case 'owo':
       if(button.clicker.member.roles.cache.get("847856962016510002")){
         await button.clicker.member.roles.remove("847856962016510002")
         button.reply.send(`I have removed <@&847856962016510002> from you.`, true)
       } else {
         await button.clicker.member.roles.add("847856962016510002")
         button.reply.send(`I have added <@&847856962016510002> to you.`, true)
       }
        break;
      case 'mudae':
       if(button.clicker.member.roles.cache.get("847857085299163168")){
         await button.clicker.member.roles.remove("847857085299163168")
         button.reply.send(`I have removed <@&847857085299163168> from you.`, true)
       } else {
         await button.clicker.member.roles.add("847857085299163168")
         button.reply.send(`I have added <@&847857085299163168> to you.`, true)
       }
        break;
      case 'karuta':
       if(button.clicker.member.roles.cache.get("847857003123965982")){
         await button.clicker.member.roles.remove("847857003123965982")
         button.reply.send(`I have removed <@&847857003123965982> from you.`, true)
       } else {
         await button.clicker.member.roles.add("847857003123965982")
         button.reply.send(`I have added <@&847857003123965982> to you.`, true)
       }
        break;
      case 'red':
        if(button.clicker.member.roles.cache.get("826052226514288700")){
          await button.clicker.member.roles.remove("826052226514288700")
          button.reply.send(`I have removed <@&826052226514288700> from you.`, true)
        } else {
          await removeRoles(button)
         await button.clicker.member.roles.add("826052226514288700")
         button.reply.send(`I have added <@&826052226514288700> to you.`, true)
       }
        break;
      case 'orange':
        if(button.clicker.member.roles.cache.get("826044070408617985")){
          await button.clicker.member.roles.remove("826044070408617985")
          button.reply.send(`I have removed <@&826044070408617985> from you.`, true)
        } else {
          await removeRoles(button)
         await button.clicker.member.roles.add("826044070408617985")
         button.reply.send(`I have added <@&826044070408617985> to you.`, true)
       }
        break;
      case 'yellow':
        if(button.clicker.member.roles.cache.get("826044013685112888")){
          await button.clicker.member.roles.remove("826044013685112888")
          button.reply.send(`I have removed <@&826044013685112888> from you.`, true)
        } else {
          await removeRoles(button)
         await button.clicker.member.roles.add("826044013685112888")
         button.reply.send(`I have added <@&826044013685112888> to you.`, true)
       }
        break;
      case 'green':
        if(button.clicker.member.roles.cache.get("826043999659360267")){
          await button.clicker.member.roles.remove("826043999659360267")
          button.reply.send(`I have removed <@&826043999659360267> from you.`, true)
        } else {
          await removeRoles(button)
         await button.clicker.member.roles.add("826043999659360267")
         button.reply.send(`I have added <@&826043999659360267> to you.`, true)
       }
        break;
      case 'blue':
        if(button.clicker.member.roles.cache.get("826043885632749568")){
          await button.clicker.member.roles.remove("826043885632749568")
          button.reply.send(`I have removed <@&826043885632749568> from you.`, true)
        } else {
          await removeRoles(button)
         await button.clicker.member.roles.add("826043885632749568")
         button.reply.send(`I have added <@&826043885632749568> to you.`, true)
       }
        break;
      case 'purple':
        if(button.clicker.member.roles.cache.get("826043828510130186")){
          await button.clicker.member.roles.remove("826043828510130186")
          button.reply.send(`I have removed <@&826043828510130186> from you.`, true)
        } else {
          await removeRoles(button)
         await button.clicker.member.roles.add("826043828510130186")
         button.reply.send(`I have added <@&826043828510130186> to you.`, true)
       }
        break;
      case 'pink':
        if(button.clicker.member.roles.cache.get("826053767371161610")){
          await button.clicker.member.roles.remove("826053767371161610")
          button.reply.send(`I have removed <@&826053767371161610> from you.`, true)
        } else {
          await removeRoles(button)
         await button.clicker.member.roles.add("826053767371161610")
         button.reply.send(`I have added <@&826053767371161610> to you.`, true)
       }
        break;
      case 'black':
        if(button.clicker.member.roles.cache.get("826054029431799858")){
          await button.clicker.member.roles.remove("826054029431799858")
          button.reply.send(`I have removed <@&826054029431799858> from you.`, true)
        } else {
          await removeRoles(button)
         await button.clicker.member.roles.add("826054029431799858")
         button.reply.send(`I have added <@&826054029431799858> to you.`, true)
       }
        break;
      case 'white':
        if(button.clicker.member.roles.cache.get("826053825408139265")){
          await button.clicker.member.roles.remove("826053825408139265")
          button.reply.send(`I have removed <@&826053825408139265> from you.`, true)
        } else {
          await removeRoles(button)
         await button.clicker.member.roles.add("826053825408139265")
         button.reply.send(`I have added <@&826053825408139265> to you.`, true)
       }
        break;
      case 'random':
        if(button.clicker.member.roles.cache.get("866675725381140480")){
          await button.clicker.member.roles.remove("866675725381140480")
          button.reply.send(`I have removed <@&866675725381140480> from you.`, true)
        } else {
          await removeRoles(button)
         await button.clicker.member.roles.add("866675725381140480")
         button.reply.send(`I have added <@&866675725381140480> to you.`, true)
       }
        break;
    }

    
  }
} // 
const removeRoles = async (button) => {
      const roles = ['826052226514288700', '826044070408617985', '826044013685112888', '826043999659360267', '826043885632749568', '826043828510130186', '826053767371161610', '826054029431799858', '826053825408139265', '866675725381140480']

      await button.clicker.member.roles.remove(roles)
}