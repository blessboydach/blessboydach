// ============================================================
//  VANGUARD MD — commands/konachan.js
//  Anime Konachan SFW (Integrated)
// ============================================================

const axios = require('axios')
const fs = require('fs')
const path = require('path')

module.exports = async (ctx) => {
  const { reply, sock, jid, msg } = ctx

  // ── Configuration ──────────────────────────────────────────
  const API_URL = 'https://api.princetechn.com/api/anime/milf?apikey=prince'
  const TEMP_DIR = path.join(__dirname, '..', 'temp')
  
  // Ensure your /temp directory exists 📂
  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true })

  await reply('⏳ *Fetching milf content...*')

  try {
    // 1. Fetch JSON metadata
    const response = await axios.get(API_URL, {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })

    const imageUrl = response.data?.result
    if (!imageUrl) throw new Error('API returned an empty result.')

    // 2. Download Image into Buffer
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 20000
    })

    const imageBuffer = Buffer.from(imageResponse.data)
    
    // 3. Handle Temp File Logic (as requested) 📂
    const fileName = `konachan_${Date.now()}.jpg`
    const filePath = path.join(TEMP_DIR, fileName)
    
    fs.writeFileSync(filePath, imageBuffer)

    // 4. Send via VANGUARD system
    await sock.sendMessage(jid, {
      image: fs.readFileSync(filePath), // Reading from your owned /temp folder
      caption: '✨ *Milf Anime Art*\n> _VANGUARD MD Reality_'
    }, { quoted: msg })

    // 5. Cleanup 🧹
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)

  } catch (error) {
    console.error('megumin command error:', error)
    
    if (error.code === 'ECONNABORTED') {
      return reply('❌ Connection timed out. Try again.')
    }
    
    await reply(`❌ *Failed to fetch art:* ${error.message}`)
  }
}
