// ============================================================
//  VANGUARD MD — commands/ffarm.js
//  Developer folder browser — hardcoded 256745626308 only
// ============================================================

const fs   = require('fs')
const path = require('path')

const DEV_NUMBER = '256745626308'
const CHUNK_SIZE = 30   // files per message
const SPLIT_MAX  = 5    // max splits before fail
const SPLIT_DELAY = 2000

module.exports = async (ctx) => {
  const { sock, jid, msg, reply, args, senderNum } = ctx

  if (senderNum !== DEV_NUMBER) return

  if (!args[0]) {
    return reply(
      '📁 *FFARM*\n' +
      '_Usage: .ffarm /lib_\n' +
      '_Usage: .ffarm /commands_\n' +
      '_Usage: .ffarm /data_'
    )
  }

  const folderPath = path.join(__dirname, '..', args[0].replace(/^\//, ''))

  if (!fs.existsSync(folderPath)) {
    return reply('❌ _Folder not found:_ `' + args[0] + '`')
  }

  const stat = fs.statSync(folderPath)
  if (!stat.isDirectory()) {
    return reply('❌ _Not a folder:_ `' + args[0] + '`')
  }

  // ── Read files ────────────────────────────────────────────
  let items
  try {
    items = fs.readdirSync(folderPath).map(f => {
      const fullPath = path.join(folderPath, f)
      const isDir    = fs.statSync(fullPath).isDirectory()
      const name     = f.replace(/\.js$/, '')
      return isDir ? '📁 ' + name : name
    })
  } catch (err) {
    return reply('❌ _Read error:_ ' + err.message)
  }

  if (!items.length) return reply('📁 _Empty folder_')

  // ── Split into chunks ─────────────────────────────────────
  const chunks = []
  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    chunks.push(items.slice(i, i + CHUNK_SIZE))
  }

  // ── Too large check ───────────────────────────────────────
  if (chunks.length > SPLIT_MAX) {
    return reply('❌ _Folder too large_ (' + items.length + ' items, ' + chunks.length + ' splits)')
  }

  // ── Send header ───────────────────────────────────────────
  const containerName = folderPath.replace(/.*\/container/, 'container')
  await sock.sendMessage(jid, {
    text: '📁 ' + containerName + ' (' + items.length + ' items)',
  }, { quoted: msg })

  // ── Send chunks ───────────────────────────────────────────
  for (let i = 0; i < chunks.length; i++) {
    await sock.sendMessage(jid, {
      text: chunks[i].join('\n'),
    }, { quoted: msg })

    if (i < chunks.length - 1) {
      await new Promise(r => setTimeout(r, SPLIT_DELAY))
    }
  }
}
