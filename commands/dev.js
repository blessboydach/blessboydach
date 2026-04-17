// ============================================================
//  VANGUARD MD — commands/owner.js
// ============================================================

module.exports = async (ctx) => {
  const { sock, jid, msg, reply } = ctx

  const ownerNumber = '256745626308'
  const ownerName   = 'Admin Blue'

  const vcard =
    'BEGIN:VCARD\n' +
    'VERSION:3.0\n' +
    'FN:' + ownerName + '\n' +
    'ORG:VANGUARD MD;\n' +
    'TEL;type=CELL;type=VOICE;waid=' + ownerNumber + ':+' + ownerNumber + '\n' +
    'END:VCARD'

  await sock.sendMessage(jid, {
    contacts: {
      displayName: ownerName,
      contacts: [{ vcard }],
    }
  }, { quoted: msg })

  await reply(
    '👑 *' + ownerName + '*\n' +
    '📱 +' + ownerNumber + '\n' +
    '`  \'The Developer Of Vanguard MD\'   `'
  )
}
