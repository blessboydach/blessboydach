// ============================================================
//  VANGUARD MD — commands/listblocked.js
// ============================================================

const config   = require('../config')
const defaults = require('../defaults')

module.exports = async (ctx) => {
  const { reply, sock, isSudo } = ctx
  if (!isSudo) return reply('❌ Only sudo/owner can use this command!')

  await reply('⏳ *Fetching block list...*')

  try {
    const blocklist = await sock.fetchBlocklist()

    if (!blocklist || blocklist.length === 0) {
      return reply(
        '🚫 *BLOCKED NUMBERS*\n' +
        '✅ No blocked numbers!\n' +
        ''
      )
    }

    // ── Build list ────────────────────────────────────────
    const rows = blocklist.map((jid, i) => {
      const num = jid.replace('@s.whatsapp.net', '')
      return '' + (i + 1) + '. +' + num
    }).join('\n')

    await reply(
      '🚫 *BLOCKED NUMBERS*\n' +
      '📊 *Total:* ' + blocklist.length + ' blocked\n' +
      rows + '\n' +
      ''
    )

  } catch (err) {
    await reply('❌ Failed to fetch block list: ' + err.message)
  }
}
