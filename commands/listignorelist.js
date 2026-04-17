// ============================================================
//  VANGUARD MD — commands/listignorelist.js
// ============================================================

const fs   = require('fs')
const path = require('path')

const IGNORE_FILE = path.join(__dirname, '..', 'data', 'ignorelist.json')

const getIgnoreList = () => {
  try {
    if (!fs.existsSync(IGNORE_FILE)) return []
    return JSON.parse(fs.readFileSync(IGNORE_FILE, 'utf8'))
  } catch { return [] }
}

module.exports = async (ctx) => {
  const { reply, isSudo } = ctx
  if (!isSudo) return reply('❌ Owner/sudo only!')

  const list = getIgnoreList()

  if (!list.length) {
    return reply(
      `\n` +
      `🔊 *IGNORE LIST*\n` +
      `\n` +
      `\n` +
      `✅ No chats are ignored\n` +
      `🤖 Bot is active everywhere\n` +
      ``
    )
  }

  const lines = list.map((j, i) => `${i + 1}. \`${j}\``).join('\n')

  await reply(
    `\n` +
    `🔇 *IGNORE LIST (${list.length})*\n` +
    `\n` +
    `\n` +
    `${lines}\n` +
    `\n` +
    `_Use .remignorelist <jid> or .clearignorelist_`
  )
}
