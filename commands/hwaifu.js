// ============================================================
//  VANGUARD MD — commands/hwaifu.js
//  Anime Hwaifu NSFW (Integrated)
// ============================================================

const axios = require('axios')
const fs = require('fs')
const path = require('path')

module.exports = async (ctx) => {
  const { reply, sock, jid, msg } = ctx

  // ── Configuration ──────────────────────────────────────────
  const API_URL = 'https://api.princetechn.com/api/anime/hwaifu?apikey=prince'
  const TEMP_DIR = path.join(__dirname, '..', 'temp')
  
  // Ensure temp directory exists
  if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true })

  await reply('⏳ *Fetching hwaifu content...*')

  try {
    // 1. Fetch the image metadata
    const response = await axios.get(API_URL, {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })

    const imageUrl = response.data?.result
    if (!imageUrl || typeof imageUrl !== 'string') {
      throw new Error('API returned an invalid image URL.')
    }

    // 2. Download the image as a buffer
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 20000,
      headers: { 'Accept': 'image/*' }
    })

    const imageBuffer = Buffer.from(imageResponse.data)

    // 3. Send via VANGUARD system 
    // We use the buffer directly to stay fast ⚡
    await sock.sendMessage(jid, {
      image: imageBuffer,
      caption: '🔥 *Hwaifu Content Generated*\n> _VANGUARD MD Reality_'
    }, { quoted: msg })

  } catch (error) {
    console.error('Hwaifu command error:', error)
    
    // Detailed error feedback
    if (error.response?.status === 404) {
      return reply('❌ Source image not found. The API might be updating.')
    }
    if (error.code === 'ECONNABORTED') {
      return reply('❌ Connection timed out. The server is taking too long.')
    }
    
    await reply(`❌ *Failed to fetch:* ${error.message}`)
  }
}
