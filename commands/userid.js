// ============================================================
//  VANGUARD MD — commands/userid.js
// ============================================================

const { jidToNum } = require('../lib/utils')

module.exports = async (ctx) => {
  const { reply, sender, jid, fromGroup } = ctx
  const num = jidToNum(sender)

  await reply(
    '╭───────────────━⊷\n' +
    '┃ 🪪 *YOUR ID INFO*\n' +
    '╰───────────────━⊷\n' +
    '╭───────────────━⊷\n' +
    '┃ 📱 *Number:* +' + num + '\n' +
    '┃ 🆔 *JID:* ' + sender + '\n' +
    '┃ 💬 *Chat:* ' + jid + '\n' +
    '┃ 👥 *Type:* ' + (fromGroup ? 'Group' : 'Private DM') + '\n' +
    '╰───────────────━⊷'
  )
}
