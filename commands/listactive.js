// ============================================================
//  VANGUARD MD — commands/listactive.js
//  List all users ranked by activity
// ============================================================

const { isActive, getAllParticipantsRanked, cleanNum } = require('../lib/activeHelper')

module.exports = async (ctx) => {
  const { reply, sock, jid, fromGroup } = ctx

  if (!fromGroup) return reply('❌ This command can only be used in groups!')
  
  if (!isActive(jid)) {
    return reply('⏸️ *Active counter is OFF*\nUse `.active on` to enable tracking first.')
  }

  const ranked = await getAllParticipantsRanked(sock, jid)
  
  if (ranked.length === 0) {
    return reply('📊 No data yet. Messages will be counted from now on!')
  }

  let text = '\n📊 *ACTIVE USERS*\n' + jid.split('@')[0] + '\n\n'
  const mentions = []
  
  ranked.forEach((user, index) => {
    const rank = index + 1
    const emoji = user.inactive ? '⚪' : '🔹'
    const count = user.count || 0
    const num = cleanNum(user.num)
    
    // CRITICAL: Use the stored JID (from DB or group metadata) for proper mentioning
    mentions.push(user.jid)
    
    // Format: 1. 🔹 @number 💬567 msgs
    text += `${rank}. ${emoji} @${num} 💬${count} msgs\n`
  })

  await reply({ text, mentions })
}
