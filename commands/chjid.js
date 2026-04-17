// ============================================================
//  VANGUARD MD — commands/chjid.js
//  Get newsletter JID from channel URL
// ============================================================

module.exports = async (ctx) => {
  const { reply, args, isSudo, sock } = ctx

  if (!isSudo) return reply('❌ Owner/sudo only!')

  const input = args[0]?.trim()

  if (!input) {
    return reply(
      '📢 *CHANNEL JID*\n' +
      '❌ *Usage:* .chjid <channel_url>\n' +
      '*Example:*\n' +
      '.chjid https://whatsapp.com/channel/xxx\n' +
      ''
    )
  }

  // ── Accept full URL or just invite code ───────────────────
  const url = input.startsWith('https://')
    ? input
    : 'https://whatsapp.com/channel/' + input

  try {
    await ctx.react('⏳')

    const info = await sock.getNewsletterInfo(url)

    if (!info) {
      return reply('❌ _Could not fetch channel info — check the link!_')
    }

    const jid         = info.id         || 'N/A'
    const name        = info.name       || 'Unknown'
    const description = info.description || 'No description'
    const subscribers = info.subscriberCount ?? 'N/A'
    const verified    = info.verification === 'VERIFIED' ? '✅ Verified' : '❌ Not verified'

    await ctx.react('✅')

    await reply(
      '📢 *CHANNEL INFO*\n' +
      '📛 *Name:* ' + name + '\n' +
      '🆔 *JID:* ' + jid + '\n' +
      '👥 *Subscribers:* ' + subscribers + '\n' +
      '✅ *Status:* ' + verified + '\n' +
      '📝 *Description:*\n' +
      '' + description.slice(0, 200) + '\n' +
      ''
    )

  } catch (err) {
    await ctx.react('❌')
    await reply('❌ _Failed: ' + err.message + '_')
  }
}
