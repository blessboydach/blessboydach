// ============================================================
//  VANGUARD MD — commands/steal.js
//  Resends a sticker to add it to your recents
// ============================================================

const { downloadContentFromMessage } = require('@whiskeysockets/baileys')

module.exports = async (ctx) => {
  const { sock, msg, jid, quoted, reply } = ctx

  if (!quoted?.message?.stickerMessage) {
    return reply('❌ Reply to a sticker to steal it!\n_Usage: .steal (reply to sticker)_')
  }

  try {
    const stream = await downloadContentFromMessage(
      quoted.message.stickerMessage,
      'sticker'
    )
    let buffer = Buffer.from([])
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])

    await sock.sendMessage(jid, { sticker: buffer }, { quoted: msg })

  } catch (err) {
    await reply('❌ Failed to steal sticker: ' + err.message)
  }
}
