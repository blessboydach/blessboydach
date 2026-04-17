// ============================================================
//  VANGUARD MD — commands/listinactive.js
//  List inactive users only (0 messages) - Tagall approach
// ============================================================

const { isActive, getInactiveUsers, cleanNum } = require('../lib/activeHelper')

module.exports = async (ctx) => {
  const { reply, sock, jid, fromGroup } = ctx

  if (!fromGroup) return reply('❌ This command can only be used in groups!')
  
  if (!isActive(jid)) {
    return reply('⏸️ *Active counter is OFF*\nUse `.active on` to enable tracking first.')
  }

  // This already excludes active users internally
  const inactive = await getInactiveUsers(sock, jid)
  
  if (inactive.length === 0) {
    return reply('✅ Everyone has sent at least one message!\n🎉 No inactive users found.')
  }

  let text = '\n😴 *INACTIVE USERS*\n(No messages recorded)\n\n'
  const mentions = []
  
  inactive.forEach((user, index) => {
    const num = cleanNum(user.num)
    // Use JID from group metadata for proper tagging
    mentions.push(user.jid)
    text += `${index + 1}. ⚪ @${num} 💬0 msgs\n`
  })

  text += `\n_Total: ${inactive.length} inactive members_`

  await reply({ text, mentions })
}
