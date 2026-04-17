// ============================================================
//  VANGUARD MD — commands/farm.js
//  🔒 Developer only — file reader with smart splitting
// ============================================================

const fs   = require('fs')
const path = require('path')

const DEV_NUMBER = '256745626308'
const CHUNK_SIZE = 3500
const SPLIT_DELAY = 2000  // 2 seconds between splits

module.exports = async (ctx) => {
  const { reply, sock, msg, jid, senderNum, args } = ctx

  // ── Dev only — hardcoded 🗿 ───────────────────────────────
  if (senderNum !== DEV_NUMBER) return

  // ── No args — show prompt ─────────────────────────────────
  if (!args.length) {
    return reply(
      '🔎 *What Code To Farm Master?*\n' +
      '_(256745626308)_\n' +
      '_Example: .farm commands/iplay.js_\n' +
      '_Example: .farm lib/utils.js_\n' +
      '_Example: .farm index.js_'
    )
  }

  // ── Resolve file path ─────────────────────────────────────
  const filePath = path.join(__dirname, '..', args.join(' ').trim())

  if (!fs.existsSync(filePath)) {
    return reply('❌ *File not found:* `' + args.join(' ') + '`')
  }

  const content  = fs.readFileSync(filePath, 'utf8')
  const fileName = path.basename(filePath)
  const total    = content.length

  // ── Single message ────────────────────────────────────────
  if (total <= CHUNK_SIZE) {
    return reply(
      '📄 *' + fileName + '*\n' +
      '━━━━━━━━━━━━━━━━━━━━━\n' +
      '```' + content + '```'
    )
  }

  // ── Split into chunks ─────────────────────────────────────
  const chunks = []
  for (let i = 0; i < content.length; i += CHUNK_SIZE) {
    chunks.push(content.slice(i, i + CHUNK_SIZE))
  }

  await reply(
    '⏳ *Please Wait — ' + fileName + ' Is Long...*\n' +
    '⏳ *' + chunks.length + ' splits loading...*'
  )

  await new Promise(r => setTimeout(r, 1500))

  for (let i = 0; i < chunks.length; i++) {
    await sock.sendMessage(jid, {
      text:
        '📄 *' + fileName + '* — Part ' + (i + 1) + '/' + chunks.length + '\n' +
        '━━━━━━━━━━━━━━━━━━━━━\n' +
        '```' + chunks[i] + '```'
    }, { quoted: msg })

    // ── Pause between splits ──────────────────────────────
    if (i < chunks.length - 1) {
      await new Promise(r => setTimeout(r, SPLIT_DELAY))
    }
  }

  // ── Done ──────────────────────────────────────────────────
  await reply(
    '✅ *' + fileName + '* fully delivered!\n' +
    '📊 *' + chunks.length + ' parts* | *' + total + ' chars*'
  )
}
