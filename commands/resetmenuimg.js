// ============================================================
//  VANGUARD MD — commands/resetmenuimage.js
//  Restore the original bot menu image from backup.
//  Deletes assets/botimage.jpg and copies from
//  assets/backup/botimage.jpg back to assets/botimage.jpg.
//  Sends “Initialising ⏳…” then edits to ✅ when done.
// ============================================================

const fs   = require('fs')
const path = require('path')

const IMAGE_PATH  = path.join(__dirname, '..', 'assets', 'botimage.jpg')
const BACKUP_PATH = path.join(__dirname, '..', 'assets', 'backup', 'botimage.jpg')

module.exports = async (ctx) => {
const { sock, msg, jid, isSudo } = ctx

if (!isSudo) return ctx.reply('❌ *Owner/Sudo only!*')

// ── Check backup exists before doing anything ─────────────
if (!fs.existsSync(BACKUP_PATH)) {
return ctx.reply(
'╭───────────────━⊷\n' +
'┃ ❌ *BACKUP NOT FOUND*\n' +
'╰───────────────━⊷\n' +
'╭───────────────━⊷\n' +
'┃ *Current Menu Image Mantained:*\n' +
'┃ `Try again Later`\n' +
'╰───────────────━⊷'
)
}

// ── Send progress message — edited on completion ──────────
let progressMsg
try {
progressMsg = await sock.sendMessage(jid, {
text: 'Initialising ⏳…',
}, { quoted: msg })
} catch (_) {}

try {
// ── Delete current image if it exists ─────────────────
if (fs.existsSync(IMAGE_PATH)) {
fs.unlinkSync(IMAGE_PATH)
}

// ── Copy backup → assets/botimage.jpg ─────────────────
fs.copyFileSync(BACKUP_PATH, IMAGE_PATH)

// ── Verify write succeeded ────────────────────────────
if (!fs.existsSync(IMAGE_PATH)) {
  throw new Error('File copy failed — image not found after write')
}

// ── Edit progress message to success ─────────────────
if (progressMsg?.key) {
  try {
    await sock.sendMessage(jid, {
      text:  '✅ *Operation successful!*\n_Menu image restored to default. Send_ `' +
             (ctx.prefix || '.') + 'menu` _to preview._',
      edit:  progressMsg.key,
    })
  } catch (_) {
    await ctx.reply('✅ *Menu image restored to default!*')
  }
} else {
  await ctx.reply('✅ *Menu image restored to default!*')
}
} catch (err) {
// ── Edit to failure if something went wrong ───────────
if (progressMsg?.key) {
try {
await sock.sendMessage(jid, {
text: '❌ *Failed:* *' + err.message + '*',
edit: progressMsg.key,
})
} catch (_) {
await ctx.reply('❌ *Failed:* *' + err.message + '*')
}
} else {
await ctx.reply('❌ *Failed:* *' + err.message + '*')
}
}
}