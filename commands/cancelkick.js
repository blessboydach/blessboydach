// ============================================================
//  VANGUARD MD — commands/cancelkickinactive.js
//  Cancel pending kick operation
//  FIXED: Uses shared normalizeJid from helper
// ============================================================

const { 
  hasPendingKick, 
  getPendingKick, 
  removePendingKick,
  normalizeJid // ← Import from helper (guaranteed match)
} = require('../lib/activeHelper')

module.exports = async (ctx) => {
  const { reply, jid, fromGroup } = ctx

  if (!fromGroup) return reply('❌ This command can only be used in groups!')

  // Normalize exactly the same way as kickinactive.js
  const groupId = normalizeJid(jid)
  
  if (!hasPendingKick(groupId)) {
    return reply('✅ No pending kick operation to cancel.')
  }

  const kickData = getPendingKick(groupId)
  
  // Clear the timeout
  clearTimeout(kickData.timeout)
  
  // Remove from pending
  removePendingKick(groupId)
  
  // Confirm cancellation
  await reply('✅ *Kick operation cancelled!*\n😮‍💨 Those inactive users are safe... for now.\n*Note:* ' + kickData.count + ' users were spared.')
}
