// ============================================================
//  VANGUARD MD — commands/truth.js
// ============================================================

const { readData, randItem } = require('../lib/utils')

module.exports = async (ctx) => {
  const { reply, sender } = ctx
  const truths = readData('truths.json')
  if (!truths.length) return reply('❌ No truths found!')
  const { truth } = randItem(truths)
  await reply(`🎯 *Truth or Dare — TRUTH*\n\n@${sender.split('@')[0]}, answer honestly:\n\n❓ _${truth}_`, )
}
