// ============================================================
//  VANGUARD MD — commands/getpp.js
// ============================================================

const { jidToNum, numToJid } = require('../lib/utils')

module.exports = async (ctx) => {
  const { reply, sock, jid, msg, mentions, quoted, args, isOwner, isSudo } = ctx
  if (!isOwner && !isSudo) return reply('❌ Only owner and sudo users can use this command!')

  let targetJid = null
  let targetNum = null

  if (mentions?.[0]) {
    targetJid = mentions[0]
    targetNum = jidToNum(targetJid)
  } else if (quoted?.sender) {
    targetJid = quoted.sender
    targetNum = jidToNum(targetJid)
  } else if (args[0]) {
    targetNum = args[0].replace(/[^0-9]/g, '')
    targetJid = numToJid(targetNum)
  }

  if (!targetJid) {
    return reply('❌ Mention, reply to, or provide a number!\n_Examples:_\n• _.getpp @user_\n• _.getpp 254712345678_')
  }

  try {
    const ppUrl = await sock.profilePictureUrl(targetJid, 'image')

    await sock.sendMessage(jid, {
      image:   { url: ppUrl },
      caption:
        '🖼️ *Profile Photo Of @' + targetNum + '*\n' +
        '> *_Vanguard Is On Fire 🔥_*',
      mentions: [targetJid],
    }, { quoted: msg })

  } catch (err) {
    if (err.message?.includes('404') || err.message?.includes('not-authorized')) {
      await reply('❌ *+' + targetNum + '* has no profile picture or it\'s private.')
    } else {
      await reply('❌ Failed to get profile picture: ' + err.message)
    }
  }
}
