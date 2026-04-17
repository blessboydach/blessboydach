// ============================================================
//  VANGUARD MD — commands/meme.js
// ============================================================

const { readData, randItem } = require('../lib/utils')

module.exports = async (ctx) => {
  const { reply } = ctx
  const memes = readData('memes.json')
  if (!memes.length) return reply('❌ No memes found!')
  const { meme } = randItem(memes)
  await reply(`😂 *Meme*\n\n${meme}`)
}
