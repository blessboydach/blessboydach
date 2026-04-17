// ============================================================
//  VANGUARD MD — commands/active.js
//  Toggle message counter on/off
// ============================================================

const { isBotAdmin, isSenderAdmin } = require('../lib/utils')
const { isActive, setActive } = require('../lib/activeHelper')

module.exports = async (ctx) => {
  const { reply, sock, jid, fromGroup, sender, args, isSudo } = ctx

  if (!fromGroup) return reply('❌ This command can only be used in groups!')

  const senderIsAdmin = await isSenderAdmin(sock, jid, sender)
  
  // Owner/sudo can always toggle. Admin can only turn ON (needs bot admin check)
  // Anyone can check status
  const isPrivileged = isSudo || senderIsAdmin
  
  const subCommand = (args[0] || '').toLowerCase()
  
  // Status check - anyone can do this
  if (!subCommand || subCommand === 'status') {
    const active = isActive(jid)
    const statusText = active 
      ? '✅ *Active counter is ON*\n📊 Counting messages...'
      : '⏸️ *Active counter is OFF*\n💤 Not saving message data'
    return reply(statusText)
  }
  
  // Turn on - requires admin + bot admin
  if (subCommand === 'on') {
    if (!isPrivileged) return reply('❌ Only admins can enable this!')
    
    const botAdmin = await isBotAdmin(sock, jid)
    if (!botAdmin) return reply('❌ I need to be an admin to track activity!')
    
    setActive(jid, true)
    return reply('✅ *Active counter enabled!*\n📊 I will now track message activity in this group.')
  }
  
  // Turn off - owner/sudo only (admins can't turn off to prevent abuse)
  if (subCommand === 'off') {
    if (!isSudo && !senderIsAdmin) {
      return reply('❌ Only admins can disable this!')
    }
    
    setActive(jid, false)
    return reply('⏸️ *Active counter disabled!*\n🗑️ All message data has been cleared.')
  }
  
  return reply('❓ Usage: `.active on` | `.active off` | `.active status`')
}
