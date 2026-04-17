// ============================================================
//  VANGUARD MD — commands/dare.js
// ============================================================

const { readData, randItem } = require('../lib/utils')

module.exports = async (ctx) => {
  const { reply, sender, msg, sock, jid } = ctx
  const dares = readData('dares.json')
  if (!dares.length) return reply('❌ No dares found!')

  const { dare } = randItem(dares)
  const senderNum = sender.split('@')[0]

  await reply({
    text:
      '╭───────────────━⊷\n' +
      '┃ 🔥 *TRUTH OR DARE — DARE*\n' +
      '╰───────────────━⊷\n' +
      '╭───────────────━⊷\n' +
      '┃ @' + senderNum + ' you must:\n' +
      '┃\n' +
      '┃ 💪 _' + dare + '_\n' +
      '╰───────────────━⊷',
    mentions: [sender],
  })
}
