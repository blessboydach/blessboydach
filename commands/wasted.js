// ============================================================
//  VANGUARD MD — commands/wasted.js
// ============================================================

const axios = require('axios')

module.exports = async (ctx) => {
  const { sock, msg, jid, sender, senderNum, mentions, quoted, reply } = ctx

  // ── Resolve target ────────────────────────────────────────
  let target = null

  if (mentions?.length > 0) {
    target = mentions[0]
  } else if (quoted?.sender) {
    target = quoted.sender
  }

  // ── Self waste mode 🗿 ────────────────────────────────────
  const selfWaste = !target
  if (selfWaste) target = sender

  const targetNum = target.replace(/:[0-9]+@/, '@').replace('@s.whatsapp.net', '').replace('@g.us', '').trim()

  // ── Get profile picture ───────────────────────────────────
  let profilePic
  try {
    profilePic = await sock.profilePictureUrl(target, 'image')
  } catch (_) {
    profilePic = 'https://i.imgur.com/2wzGhpF.jpeg'
  }

  // ── Fetch wasted overlay ──────────────────────────────────
  try {
    const { data } = await axios.get(
      `https://some-random-api.com/canvas/overlay/wasted?avatar=${encodeURIComponent(profilePic)}`,
      { responseType: 'arraybuffer', timeout: 15000 }
    )

    await sock.sendMessage(jid, {
      image:    Buffer.from(data),
      caption:  selfWaste
        ? `👀🗿 @${targetNum} wasted their own self Bruh 🫩😂\n_reply or tag a victim next time_`
        : `⚰️ *WASTED* — @${targetNum} 💀\n_Rest in pieces_ 🪦`,
      mentions: [target],
    }, { quoted: msg })

  } catch (err) {
    await reply(`❌ Failed to create wasted image: ${err.message}`)
  }
}
