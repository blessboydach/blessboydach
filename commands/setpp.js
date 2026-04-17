// ============================================================
//  VANGUARD MD — commands/setpp.js
// ============================================================
const { downloadContentFromMessage } = require('@whiskeysockets/baileys')

module.exports = async (ctx) => {
  const { sock, reply, quoted, isSudo } = ctx
  if (!isSudo) return reply('❌ Command Restricted to Owner/sudo only!')

  const imageMsg = quoted?.message?.imageMessage
  if (!imageMsg) return reply('❌ _That is not an Image ,Reply to an image!_')

  try {
    const stream  = await downloadContentFromMessage(imageMsg, 'image')
    const chunks  = []
    for await (const chunk of stream) chunks.push(chunk)
    const buffer  = Buffer.concat(chunks)
    await sock.updateProfilePicture(sock.user.id, buffer)
    await reply('✅ _Profile Photo updated Successfully!_')
  } catch (err) {
    await reply('❌ Failed to update profile photo: ' + err.message)
  }
}
