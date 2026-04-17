// ============================================================
//  VANGUARD MD — commands/remignorelist.js
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

const saveIgnoreList = (list) => {
  try {
    fs.mkdirSync(path.dirname(IGNORE_FILE), { recursive: true })
    fs.writeFileSync(IGNORE_FILE, JSON.stringify(list, null, 2))
  } catch (_) {}
}

module.exports = async (ctx) => {
  const { reply, jid, isSudo, args } = ctx
  if (!isSudo) return reply('❌ Owner/sudo only!')

  const target = args[0] || jid

  const list = getIgnoreList()
  if (!list.includes(target)) {
    return reply(`⚠️ _${target} is not in the ignore list!_`)
  }

  const updated = list.filter(j => j !== target)
  saveIgnoreList(updated)

  await reply(
   
    `✅ *${target}* removed from ignore list\n` +
    ` 🤖 Bot is active here again!\n` +
    ``
  )
}
