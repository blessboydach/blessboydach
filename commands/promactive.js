// ============================================================
//  VANGUARD MD — commands/promactive.js
//  Promote top 3 active users to admin
// ============================================================

const { isBotAdmin, isSenderAdmin, jidToNum } = require('../lib/utils')
const { isActive, getTopActive } = require('../lib/activeHelper')

module.exports = async (ctx) => {
  const { reply, sock, jid, fromGroup, sender, isSudo } = ctx

  if (!fromGroup) return reply('❌ This command can only be used in groups!')

  const senderIsAdmin = await isSenderAdmin(sock, jid, sender)
  if (!isSudo && !senderIsAdmin) return reply('❌ Only admins can use this command!')

  const botAdmin = await isBotAdmin(sock, jid)
  if (!botAdmin) return reply('❌ I need to be an admin to promote members!')

  if (!isActive(jid)) {
    return reply('⏸️ *Active counter is OFF*\nUse `.active on` to enable tracking first.')
  }

  const top = getTopActive(jid, 3).filter(u => u.count > 0)
  
  if (top.length === 0) {
    return reply('📊 No active users to promote yet!')
  }

  // Check current admins
  const meta = await sock.groupMetadata(jid)
  const admins = new Set(
    meta.participants
      .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
      .map(p => jidToNum(p.id))
  )

  const toPromote = []
  const alreadyAdmin = []
  const mentions = []

  for (const user of top) {
    mentions.push(user.num + '@s.whatsapp.net')
    if (admins.has(user.num)) {
      alreadyAdmin.push(user)
    } else {
      toPromote.push(user)
    }
  }

  let text = '╭───────────────━⊷\n┃ ⭐ *PROACTIVE RESULTS*\n╰───────────────━⊷\n'

  // Promote eligible users
  if (toPromote.length > 0) {
    const jidsToPromote = toPromote.map(u => u.num + '@s.whatsapp.net')
    
    try {
      await sock.groupParticipantsUpdate(jid, jidsToPromote, 'promote')
      text += `✅ *Promoted (${toPromote.length}):*\n`
      toPromote.forEach((u, i) => {
        const medals = ['🥇', '🥈', '🥉']
        text += `${medals[i]} @${u.num} — 💬${u.count} msgs\n`
      })
    } catch (err) {
      text += `❌ Failed to promote: ${err.message}\n`
    }
  }

  if (alreadyAdmin.length > 0) {
    text += `\n😎 *Already Admin (${alreadyAdmin.length}):*\n`
    alreadyAdmin.forEach((u, i) => {
      text += `• @${u.num} — 💬${u.count} msgs\n`
    })
  }

  await reply({ text, mentions })
}
