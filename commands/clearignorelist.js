// ============================================================
//  VANGUARD MD — commands/clearignorelist.js
// ============================================================

const fs   = require('fs')
const path = require('path')

const IGNORE_FILE = path.join(__dirname, '..', 'data', 'ignorelist.json')

module.exports = async (ctx) => {
  const { reply, isSudo } = ctx
  if (!isSudo) return reply('❌ Owner/sudo only!')

  try {
    fs.writeFileSync(IGNORE_FILE, JSON.stringify([], null, 2))
  } catch (_) {}

  await reply(
    `\n` +
    `🔊 *IGNORE LIST CLEARED*\n` +
    `\n` +
    `\n` +
    `✅ All chats restored\n` +
    `🤖 Bot is fully active everywhere\n` +
    ``
  )
}
