// ============================================================
//  VANGUARD MD — commands/topactive.js
//  Top 5 most active members with medals
// ============================================================

const { isActive, getTopActive, cleanNum } = require('../lib/activeHelper')

const MEDALS = ['🥇', '🥈', '🥉', '🏅', '🎖️']

module.exports = async (ctx) => {
  const { reply, jid, fromGroup } = ctx

  if (!fromGroup) return reply('❌ This command can only be used in groups!')
  
  if (!isActive(jid)) {
    return reply('⏸️ *Active counter is OFF*\nUse `.active on` to enable tracking first.')
  }

  const top = getTopActive(jid, 5)
  
  if (top.length === 0) {
    return reply('📊 No data yet. Messages will be counted from now on!')
  }

  let text = '╭───────────────━⊷\n┃ 🏆 *TOP ACTIVE MEMBERS*\n╰───────────────━⊷\n\n'
  const mentions = []
  
  top.forEach((user, index) => {
    const medal = MEDALS[index] || '🏅'
    const num = cleanNum(user.num)
    // Use stored JID for proper mentioning
    mentions.push(user.jid)
    text += `${medal} @${num} — 💬${user.count} msgs\n`
  })

  await reply({ text, mentions })
}
