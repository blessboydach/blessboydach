// ============================================================
//  VANGUARD MD — commands/kickinactive.js
//  Kick inactive users with 5s cancellation window
//  FIXED: Proper JID normalization using shared helper
// ============================================================

const { isBotAdmin, isSenderAdmin } = require('../lib/utils')
const { 
  isActive, 
  getInactiveUsers, 
  setPendingKick, 
  hasPendingKick, 
  removePendingKick,
  normalizeJid // ← Import from helper (single source of truth)
} = require('../lib/activeHelper')

module.exports = async (ctx) => {
  const { reply, sock, jid, fromGroup, sender, isSudo } = ctx

  if (!fromGroup) return reply('❌ This command can only be used in groups!')
  
  // Normalize the group ID for consistent Map lookup
  const groupId = normalizeJid(jid)
  
  if (hasPendingKick(groupId)) {
    return reply('⏳ A kick operation is already pending for this group!\nUse `.cancelkickinactive` to cancel it first.')
  }

  const senderIsAdmin = await isSenderAdmin(sock, jid, sender)
  if (!isSudo && !senderIsAdmin) return reply('❌ Only admins can use this command!')

  const botAdmin = await isBotAdmin(sock, jid)
  if (!botAdmin) return reply('❌ I need to be an admin to kick members!')

  if (!isActive(jid)) {
    return reply('⏸️ *Active counter is OFF*\nUse `.active on` to enable tracking first.')
  }

  const inactive = await getInactiveUsers(sock, jid)
  
  if (inactive.length === 0) {
    return reply('✅ No inactive users to kick!\nEveryone has sent at least one message.')
  }

  // Warning message
  const warningText = 
    '⚠️ *KICK INACTIVE USERS*\n' +
    '\n' +
    `Kicking *${inactive.length}* inactive users in *5 seconds*...\n` +
    '_⚠️ Bot is unaware of users who sent messages before it was an admin or deployed_\n' +
    'Type `.cancelkickinactive` to stop this operation.'

  await reply(warningText)

  // Store pending operation BEFORE setting timeout
  const kickTimeout = setTimeout(async () => {
    removePendingKick(groupId)
    
    try {
      // Re-check inactive list (might have changed)
      const currentInactive = await getInactiveUsers(sock, jid)
      const jidsToKick = currentInactive.map(u => u.jid)
      
      if (jidsToKick.length === 0) {
        await sock.sendMessage(jid, { text: '✅ No inactive users remaining to kick.' })
        return
      }

      // Kick in batches of 10 (WhatsApp limit)
      for (let i = 0; i < jidsToKick.length; i += 10) {
        const batch = jidsToKick.slice(i, i + 10)
        await sock.groupParticipantsUpdate(jid, batch, 'remove')
        await new Promise(r => setTimeout(r, 1000))
      }

      await sock.sendMessage(jid, {
        text: `✅ Kicked *${jidsToKick.length}* inactive users.\n💬 They had 0 recorded messages.`
      })
    } catch (err) {
      await sock.sendMessage(jid, {
        text: '❌ Failed to kick some users: ' + err.message
      })
    }
  }, 10000)

  // Store with normalized key
  setPendingKick(groupId, {
    timeout: kickTimeout,
    startedBy: sender,
    count: inactive.length,
    startedAt: Date.now(),
    originalJid: jid
  })
}
