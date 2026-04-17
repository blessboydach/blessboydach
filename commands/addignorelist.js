// ============================================================
//  VANGUARD MD — commands/addignorelist.js
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
  const { reply, jid, fromGroup, isSudo, args } = ctx
  if (!isSudo) return reply('❌ Owner/sudo only!')

  // Use current chat or provided JID
  const target = args[0] || jid

  const list = getIgnoreList()
  if (list.includes(target)) {
    return reply(`⚠️ _${target} is already in the ignore list!_`)
  }

  list.push(target)
  saveIgnoreList(list)

  const label = fromGroup && target === jid ? 'This group' : target
  await reply(
    `✅ *${label}* added to ignore list\n` +
    ` Bot will go dark here\n` +
    `_Use .remignorelist to restore_\n` +
    ``
  )
}

module.exports.getIgnoreList = getIgnoreList
