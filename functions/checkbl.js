const blacklists = require('../database/models/blacklist')

  const checkBL = () => {
    const now = new Date()
    console.log("Checking blacklists...")
    const conditional = {
      expires: {
        $lt: now
      },
    }
    const results = await blacklists.find(conditional)

    if(results && results.length){
      await blacklists.delete(conditional)
    }
    setTimeout(checkBL, 1000 * 60)
  }

  checkBL()
