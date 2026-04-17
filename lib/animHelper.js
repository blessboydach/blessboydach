// ============================================================
//  VANGUARD MD — lib/animHelper.js
//  Shared Anime Engine — used by 35+ commands
// ============================================================

const axios = require('axios')

module.exports = async (ctx, character) => {
  const { sock, jid, msg, reply } = ctx
  const name = character.toLowerCase()

  await reply(`📡 *fetching images of *${name.toUpperCase()}*...`)

  try {
    const apiUrl = `https://raw.githubusercontent.com/Guru322/api/Guru/BOT-JSON/anime-${name}.json`
    const res = await axios.get(apiUrl, { timeout: 15000 })
    
    const images = res.data
    if (!Array.isArray(images) || images.length === 0) {
      return reply(`❌ No images found for ${name} in the database.`)
    }

    // Pick 3 random images
    const selected = images.sort(() => 0.5 - Math.random()).slice(0, 3)

    for (const imgUrl of selected) {
      try {
        const imgRes = await axios.get(imgUrl, { 
            responseType: 'arraybuffer', 
            timeout: 10000 
        })
        
        await sock.sendMessage(jid, { 
            image: Buffer.from(imgRes.data), 
            caption: `✨ *Character:* ${name.toUpperCase()}\n> _VANGUARD MD_` 
        }, { quoted: msg })
      } catch (e) {
        continue // Skip broken links
      }
    }
  } catch (error) {
    reply(`❌ *Database Error:* Could not connect to the anime vault.`)
  }
}
