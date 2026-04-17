// ============================================================
//  VANGUARD MD — commands/channeljid.js
// ============================================================
module.exports = async (ctx) => {
  const { sock, reply, args, isSudo } = ctx
  if (!isSudo) return reply('❌Command Restricted to Owner/sudo only!')

  const link = args[0]
  if (!link) return reply('❌ _Usage: .channeljid <channel link>_')

  try {
    const code = link.split('whatsapp.com/channel/')[1]?.trim()
    if (!code) return reply('❌ Invalid channel link!')

    const result = await sock.newsletterMetadata('invite', code)
    await reply(
      '📢 *Channel JID*\n' +
      '`' + result.id + '`\n' +
      '_' + (result.name || 'Unknown') + '_'
    )
  } catch (err) {
    await reply('❌ Failed to fetch : ' + err.message)
  }
}
