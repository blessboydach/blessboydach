// ============================================================
//  VANGUARD MD — commands/anime.js
//  Character Image Gallery (Integrated)
// ============================================================

const axios = require('axios')

const supportedAnimes = [
  'akira', 'akiyama', 'anna', 'asuna', 'ayuzawa', 'boruto', 'chiho', 'chitoge',
  'deidara', 'erza', 'elaina', 'eba', 'emilia', 'hestia', 'hinata', 'inori',
  'isuzu', 'itachi', 'itori', 'kaga', 'kagura', 'kaori', 'keneki', 'kotori',
  'kurumi', 'madara', 'mikasa', 'miku', 'minato', 'naruto', 'nezuko', 'sagiri',
  'sasuke', 'sakura'
]

module.exports = async (ctx) => {
  const { reply, sock, jid, msg, args, prefix, command } = ctx

  const input = args[0]?.toLowerCase()

  // ── 1. Show Menu if no input or invalid name ──────────────
  if (!input || !supportedAnimes.includes(input)) {
    let menu = `\n`
    menu += `🎀 *VANGUARD ANIME WALLS*\n`
    menu += `\n`
    menu += `*Available Characters:*\n`
    
    // Organizes the list into readable chunks
    const chunked = []
    for (let i = 0; i < supportedAnimes.length; i += 3) {
      chunked.push(supportedAnimes.slice(i, i + 3).join(' | '))
    }
    menu += `${chunked.join('\n')}\n`
    
    menu += `\n`
    menu += `📌 *Usage:* \`${prefix}${command} <name>\`\n`
    menu += `💡 *Example:* \`${prefix}${command} hinata\`\n`
    menu += `\n`
    menu += `> _VANGUARD MD Reality_`

    return reply(menu)
  }

  await reply(`📡 *Fetching random ${input} images...*`)

  try {
    // 2. Fetch the JSON database for the specific character
    const apiUrl = `https://raw.githubusercontent.com/Guru322/api/Guru/BOT-JSON/anime-${input}.json`
    const res = await axios.get(apiUrl, { timeout: 15000 })
    
    const images = res.data
    if (!Array.isArray(images) || images.length === 0) {
      throw new Error('Database is empty for this character.')
    }

    // 3. Pick 3 random images
    const shuffled = images.sort(() => 0.5 - Math.random())
    const selected = shuffled.slice(0, 3)

    // 4. Send the images
    for (const imgUrl of selected) {
      try {
        const imgRes = await axios.get(imgUrl, { 
            responseType: 'arraybuffer', 
            timeout: 10000 
        })
        
        await sock.sendMessage(jid, { 
            image: Buffer.from(imgRes.data), 
            caption: `✨ *Character:* ${input.toUpperCase()}\n> _VANGUARD MD_` 
        }, { quoted: msg })
      } catch (e) {
        // Skip individual failed images without stopping the whole command
        console.error(`Failed to load image: ${imgUrl}`)
      }
    }

  } catch (error) {
    console.error('Anime command error:', error)
    await reply(`❌ *Database Error:* ${error.message}`)
  }
}
