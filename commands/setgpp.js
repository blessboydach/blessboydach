// ============================================================
//  VANGUARD MD — commands/setgpp.js
// ============================================================
const { downloadContentFromMessage } = require('@whiskeysockets/baileys')

module.exports = async (ctx) => {
  const { sock, jid, reply, quoted, fromGroup, isOwner, isSudo } = ctx

  if (!fromGroup) return reply('❌ _Please Use in a group!_')

  // ── Group admins can use this ─────────────────────────────
  if (!isSudo) {
    const meta    = await sock.groupMetadata(jid).catch(() => null)
    const botJid  = sock.user.id.split(':')[0] + '@s.whatsapp.net'
    const isAdmin = meta?.participants?.find(p =>
      p.id.includes(botJid.split('@')[0])
    )?.admin
    if (!isAdmin) return reply('❌ _You must be admin first!_')

    const senderJid   = ctx.sender
    const senderAdmin = meta?.participants?.find(p =>
      p.id.includes(ctx.senderNum)
    )?.admin
    if (!senderAdmin && !isSudo) return reply('❌ _You are not an Admin!_')
  }

  const imageMsg = quoted?.message?.imageMessage
  if (!imageMsg) return reply('❌ _Reply to an image!_')

  try {
    const stream = await downloadContentFromMessage(imageMsg, 'image')
    const chunks = []
    for await (const chunk of stream) chunks.push(chunk)
    const buffer = Buffer.concat(chunks)
    await sock.updateProfilePicture(jid, buffer)
    await reply('✅ _Group icon updated!_')
  } catch (err) {
    await reply('❌ Failed: ' + err.message)
  }
}
