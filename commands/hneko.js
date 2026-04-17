// ============================================================
//  VANGUARD MD — commands/hneko.js
//  Anime Hneko NSFW (Integrated)
// ============================================================

const axios = require('axios')

module.exports = async (ctx) => {
  const { reply, sock, jid, msg } = ctx

  // ── Configuration ──────────────────────────────────────────
  const API_URL = 'https://api.princetechn.com/api/anime/hneko?apikey=prince'
  
  await reply('⏳ *Fetching hneko content...*')

  try {
    // 1. Fetch the image metadata
    const response = await axios.get(API_URL, {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0' }
    })

    const imageUrl = response.data?.result
    if (!imageUrl) throw new Error('API returned an empty result.')

    // 2. Download the image as a buffer (direct-to-memory)
    const imageResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 20000,
      headers: { 'Accept': 'image/*' }
    })

    const imageBuffer = Buffer.from(imageResponse.data)

    // 3. Send via VANGUARD system
    await sock.sendMessage(jid, {
      image: imageBuffer,
      caption: '🔥 *Hneko Content Generated*\n> _VANGUARD MD Reality_'
    }, { quoted: msg })

  } catch (error) {
    console.error('Hneko command error:', error)
    
    // Custom error messages for common API failures
    if (error.response?.status === 404) {
        return reply('❌ Content not found at the source.')
    }
    if (error.code === 'ECONNABORTED') {
        return reply('❌ Connection timed out. Try again.')
    }
    
    await reply(`❌ *Failed to fetch:* ${error.message}`)
  }
}
