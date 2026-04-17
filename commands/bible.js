// ============================================================
//  VANGUARD MD — commands/bible.js
//  The Holy Bible (Integrated)
// ============================================================

const axios = require('axios')

module.exports = async (ctx) => {
  const { reply, args, prefix, command } = ctx

  const reference = args.join(' ')
  if (!reference) {
    return reply(
      `\n` +
      `✝️ *VANGUARD BIBLE*\n` +
      `\n` +
      `*Usage:* \`${prefix}${command} <book chapter:verse>\`\n` +
      `*Example:* \`${prefix}${command} John 3:16\`\n` +
      ``
    )
  }

  await reply('📖 *Opening the Scriptures...*')

  try {
    const url = `https://bible-api.com/${encodeURIComponent(reference)}`
    const res = await axios.get(url)
    const data = res.data

    const output = 
      `\n` +
      `📖 *THE HOLY BIBLE*\n` +
      `\n` +
      `📍 *Ref:* ${data.reference}\n` +
      `📜 *Ver:* ${data.verses.length} verse(s)\n` +
      `🌐 *Trans:* ${data.translation_name}\n` +
      `\n` +
      `\n` +
      `${data.text.trim()}\n` +
      `\n` +
      `\n` +
      `> _VANGUARD MD Spiritual Core_`

    await reply(output)

  } catch (error) {
    console.error('Bible command error:', error)
    await reply('❌ *Error:* Could not find that reference. Ensure it is correct (e.g., Genesis 1:1).')
  }
}
