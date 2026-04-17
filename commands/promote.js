// ============================================================
//  VANGUARD MD — commands/promote.js
//  Sudo = God Mode + Self-Promote Allowed 🗿
// ============================================================

const { isBotAdmin, isSenderAdmin, jidToNum } = require('../lib/utils')

module.exports = async (ctx) => {
  const { reply, sock, jid, fromGroup, sender, mentions, quoted, isSudo, botNumber } = ctx

  // STEP 1: Must be in group
  if (!fromGroup) return reply('❌ This command can only be used in groups!')

  // STEP 2: Check if sender is OWNER/SUDO first
  if (!isSudo) {
    return reply('❌ Only owner and sudo users can use this command!')
  }

  // STEP 3: SUDO MODE - Bot MUST be admin
  const botAdmin = await isBotAdmin(sock, jid)
  if (!botAdmin) {
    return reply(
      '╭───────────────━⊷\n' +
      '┃ ⬆️ *PROMOTE*\n' +
      '╰───────────────━⊷\n' +
      '╭───────────────━⊷\n' +
      '┃ ❌ *I need to be an admin first!*\n' +
      '╰───────────────━⊷'
    )
  }

  // STEP 4: Validate target
  let target = mentions?.[0] || null
  if (!target && quoted?.sender) target = quoted.sender
  
  if (!target) {
    return reply('❌ Mention or reply to someone!\n_Example: .promote @user_')
  }

  // STEP 5: Check if target is THE BOT itself
  const botJid = botNumber || sock.user?.id || 'unknown'
  const targetNum = jidToNum(target)
  
  if (target === botJid || targetNum === jidToNum(botJid)) {
    // Bot is already admin (we checked in step 3), so just say already admin
    return reply({
      text: '😌 _I am already an Admin 😎_',
      mentions: [botJid],
    })
  }

  // STEP 6: Check if target already admin
  const targetIsAdmin = await isSenderAdmin(sock, jid, target)
  if (targetIsAdmin) {
    return reply({
      text: '😌 _@' + targetNum + ' is already an Admin 😎_',
      mentions: [target],
    })
  }

  // STEP 7: Execute promotion (works for sudo promoting themselves or others)
  try {
    await sock.groupParticipantsUpdate(jid, [target], 'promote')
    return reply({
      text: 
        '╭───────────────━⊷\n' +
        '┃ ⬆️ *PROMOTED*\n' +
        '╰───────────────━⊷\n' +
        '╭───────────────━⊷\n' +
        '┃ ✅ @' + targetNum + ' has been promoted!\n' +
        '╰───────────────━⊷',
      mentions: [target],
    })
  } catch (err) {
    return reply('❌ Failed to promote: ' + err.message)
  }
}
