// ============================================================
//  VANGUARD MD — commands/translate.js
//  Multi-Engine Translator (Integrated)
// ============================================================

const axios = require('axios')

module.exports = async (ctx) => {
  const { reply, args, quoted, prefix, command } = ctx

  let textToTranslate = ''
  let targetLang = ''

  // 1. Resolve Text and Language
  if (quoted) {
    // If replying to a message: .tr fr
    textToTranslate = quoted.message?.conversation || 
                      quoted.message?.extendedTextMessage?.text || 
                      quoted.message?.imageMessage?.caption || 
                      ''
    targetLang = args[0]?.toLowerCase()
  } else {
    // If typing directly: .tr hello fr
    if (args.length < 2) {
      return reply(
        `╭───────────────━⊷\n` +
        `┃ 🌐 *VANGUARD TRANSLATOR*\n` +
        `╰───────────────━⊷\n` +
        `*Usage:*\n` +
        `1. Reply to text: \`${prefix}${command} <lang>\`\n` +
        `2. Direct text: \`${prefix}${command} <text> <lang>\`\n\n` +
        `*Example:* \`${prefix}${command} hello es\`\n` +
        `╰───────────────━⊷`
      )
    }
    targetLang = args.pop().toLowerCase() // Last word is the lang code
    textToTranslate = args.join(' ')
  }

  if (!textToTranslate || !targetLang) {
    return reply('❌ *Error:* Provide text and a valid language code (e.g., en, fr, es).')
  }

  await reply('⏳ *Translating...*')

  let result = null

  try {
    // ── ENGINE 1: Google Translate ──────────────────────────
    const googleUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(textToTranslate)}`
    const res1 = await axios.get(googleUrl)
    if (res1.data?.[0]?.[0]?.[0]) {
      result = res1.data[0][0][0]
    }

    // ── ENGINE 2: MyMemory Fallback ─────────────────────────
    if (!result) {
      const memUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=auto|${targetLang}`
      const res2 = await axios.get(memUrl)
      if (res2.data?.responseData?.translatedText) {
        result = res2.data.responseData.translatedText
      }
    }

    // ── ENGINE 3: Dreaded API Fallback ──────────────────────
    if (!result) {
      const dreadUrl = `https://api.dreaded.site/api/translate?text=${encodeURIComponent(textToTranslate)}&lang=${targetLang}`
      const res3 = await axios.get(dreadUrl)
      if (res3.data?.translated) {
        result = res3.data.translated
      }
    }

    if (!result) throw new Error('All translation engines failed.')

    // 2. Format and Send Output
    const output = 
      `╭───────────────━⊷\n` +
      `┃ 🌐 *VANGUARD TRANSLATION*\n` +
      `╰───────────────━⊷\n` +
      `┃ 🎯 *To:* ${targetLang.toUpperCase()}\n` +
      `┃\n` +
      `┃ 📝 *Result:*\n` +
      `┃ ${result}\n` +
      `╰───────────────━⊷\n` +
      `> _Powered by Vanguard Multi-Engine_`

    await reply(output)

  } catch (error) {
    console.error('Translation error:', error)
    await reply(`❌ *Translation Failed:* ${error.message}`)
  }
}
