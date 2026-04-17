// ============================================================
//  VANGUARD MD — commands/quran.js
//  Quran & Audio Recitation (Integrated)
// ============================================================

const axios = require('axios')

module.exports = async (ctx) => {
  const { reply, sock, jid, msg, args, prefix, command } = ctx

  const input = args[0]
  if (!input) {
    return reply(
      `╭───────────────━⊷\n` +
      `┃ 🕋 *VANGUARD QURAN*\n` +
      `╰───────────────━⊷\n` +
      `*Usage:* \`${prefix}${command} <surah_number/name>\`\n` +
      `*Example:* \`${prefix}${command} 1\` or \`${prefix}${command} Al-Fatiha\`\n` +
      `╰───────────────━⊷`
    )
  }

  await reply('🕋 *Searching for Surah...*')

  try {
    // 1. Fetch List to find the correct Surah
    const listRes = await axios.get("https://quran-endpoint.vercel.app/quran")
    const surahData = listRes.data.data.find(
      (s) => 
        s.number === Number(input) || 
        s.asma.en.short.toLowerCase() === input.toLowerCase()
    )

    if (!surahData) throw new Error('Surah not found.')

    // 2. Fetch specific Surah details
    const res = await axios.get(`https://quran-endpoint.vercel.app/quran/${surahData.number}`)
    const json = res.data.data

    const output = 
      `╭───────────────━⊷\n` +
      `┃ 🕋 *QURAN: THE HOLY BOOK*\n` +
      `╰───────────────━⊷\n` +
      `┃ 📖 *Surah ${json.number}:* ${json.asma.ar.long}\n` +
      `┃ 🌐 *English:* ${json.asma.en.long}\n` +
      `┃ 📑 *Verses:* ${json.ayahCount}\n` +
      `┃ 🌍 *Type:* ${json.type.en}\n` +
      `╰───────────────━⊷\n` +
      `┃\n` +
      `┃ 📝 *Tafsir (Summary):*\n` +
      `┃ _${json.tafsir.id.substring(0, 500)}..._\n` +
      `┃\n` +
      `╰───────────────━⊷\n` +
      `> _VANGUARD MD Spiritual Core_`

    await reply(output)

    // 3. Send Audio Recitation (if available)
    if (json.recitation.full) {
      await sock.sendMessage(jid, {
        audio: { url: json.recitation.full },
        mimetype: "audio/mp4",
        ptt: true // Voice Note style
      }, { quoted: msg })
    }

  } catch (error) {
    console.error('Quran command error:', error)
    await reply(`❌ *Error:* ${error.message}`)
  }
}
