// ============================================================
//  VANGUARD MD — commands/join.js
// ============================================================
module.exports = async (ctx) => {
  const { sock, reply, args, isSudo } = ctx
  if (!isSudo) return reply('❌ Command Restricted to Owner/sudo only!')

  const link = args[0]
  if (!link) return reply('❌ _Usage: .join <invite link>_')

  const code = link.includes('chat.whatsapp.com/')
    ? link.split('chat.whatsapp.com/')[1]?.trim()
    : link.trim()

  if (!code) return reply('❌This link is Invalid or was reset ,try again with a new one instead!')

  try {
    await sock.groupAcceptInvite(code)
    await reply('✅ _Group joined  successfully!_')
  } catch (err) {
    await reply('❌ Join Failed: ' + err.message)
  }
}
