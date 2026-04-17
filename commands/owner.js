// ============================================================
//  VANGUARD MD — commands/owner.js
//  Dynamic Owner Contact (reads data/config.json)
// ============================================================

const fs = require('fs')
const path = require('path')

module.exports = async (ctx) => {
  const { sock, jid, msg } = ctx

  const configPath = path.join(__dirname, '..', 'data', 'config.json')
  let config = {}

  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
  } catch (e) {}

  // Use saved values or fallback to default "Not Set"
  const ownerName   = config.MyName || 'Not Set'
  let ownerNumber   = config.MyNum  || '254000000000'

  // Clean number for vCard (only digits)
  const cleanNum = ownerNumber.replace(/[^0-9]/g, '')

  const vcard =
    'BEGIN:VCARD\n' +
    'VERSION:3.0\n' +
    'FN:' + ownerName + '\n' +
    'TEL;type=CELL;waid=' + cleanNum + ':+' + ownerNumber + '\n' +
    'END:VCARD'

  // Send PURE contact card only (no extra text)
  await sock.sendMessage(jid, {
    contacts: {
      displayName: ownerName,
      contacts: [{ vcard }]
    }
  }, { quoted: msg })
}