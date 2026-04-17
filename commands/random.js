// ============================================================
//  VANGUARD MD — commands/random.js
//  Random Anime Discovery (Integrated)
// ============================================================

const axios = require('axios')
const fs = require('fs')
const path = require('path')

module.exports = async (ctx) => {
  const { reply, sock, jid, msg } = ctx

  // ── Configuration ──────────────────────────────────────────
  const API_URL = 'https://api.princetechn.com/api/anime/random?apikey=prince'
  const TEMP_DIR = path.join(__dirname, '..', 'temp')
  
  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true })

  await reply('🔍 *Scanning database for random anime...*')

  try {
    // 1. Fetch Anime Data
    const response = await axios.get(API_URL, {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })

    const anime = response.data?.result
    if (!anime) throw new Error('Could not find any anime data.')

    // 2. Build the "Vanguard" Caption
    let caption = `╭───────────────━⊷\n`
    caption += `┃ 📺 *${anime.title || 'Unknown Anime'}*\n`
    caption += `╰───────────────━⊷\n`
    if (anime.episodes) caption += `┃ 🎞️ *Episodes:* ${anime.episodes}\n`
    if (anime.status)   caption += `┃ 📊 *Status:* ${anime.status}\n`
    if (anime.link)     caption += `┃ 🔗 *Link:* ${anime.link}\n`
    caption += `╰───────────────━⊷\n`
    
    if (anime.synopsis) {
      // Trim synopsis if it's too long for a WhatsApp caption
      const summary = anime.synopsis.length > 400 
        ? anime.synopsis.substring(0, 397) + '...' 
        : anime.synopsis
      caption += `📝 *Synopsis:*\n_${summary}_\n`
      caption += `╰───────────────━⊷\n`
    }
    caption += `> _VANGUARD MD Discovery_`

    // 3. Handle Thumbnail
    if (anime.thumbnail) {
      try {
        const imgRes = await axios.get(anime.thumbnail, { 
          responseType: 'arraybuffer',
          timeout: 15000 
        })
        const buffer = Buffer.from(imgRes.data)
        
        // Save to your /temp folder
        const filePath = path.join(TEMP_DIR, `random_${Date.now()}.jpg`)
        fs.writeFileSync(filePath, buffer)

        // Send with Image
        await sock.sendMessage(jid, {
          image: fs.readFileSync(filePath),
          caption: caption
        }, { quoted: msg })

        // Immediate Cleanup
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
        return
      } catch (imgErr) {
        console.error('Thumbnail download failed:', imgErr.message)
      }
    }

    // 4. Fallback: Send text only if image fails or doesn't exist
    await reply(caption)

  } catch (error) {
    console.error('Random anime command error:', error)
    await reply(`❌ *Database Error:* ${error.message}`)
  }
}
