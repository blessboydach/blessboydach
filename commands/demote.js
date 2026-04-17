// ============================================================
//  VANGUARD MD — commands/demote.js
//  Sudo = God Mode + Self-Demote Allowed 🗿
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
      '⬇️ *DEMOTE*\n' +
      '❌ *I need to be an admin first!*\n' +
      ''
    )
  }

  // STEP 4: Validate target
  let target = mentions?.[0] || null
  if (!target && quoted?.sender) target = quoted.sender
  
  if (!target) {
    return reply('❌ Mention or reply to someone!\n_Example: .demote @user_')
  }

  // STEP 5: Check if target is THE BOT itself
  const botJid = botNumber || sock.user?.id || 'unknown'
  const targetNum = jidToNum(target)
  
  if (target === botJid || targetNum === jidToNum(botJid)) {
    // Bot is not an admin (or can't demote itself), just say not an admin
    return reply({
      text: '😌 _I am not an Admin here_',
      mentions: [botJid],
    })
  }

  // STEP 6: Check if target is actually an admin
  const targetIsAdmin = await isSenderAdmin(sock, jid, target)
  if (!targetIsAdmin) {
    return reply({
      text: '😌 _@' + targetNum + ' is not even an admin!_',
      mentions: [target],
    })
  }

  // STEP 7: Execute demotion (works for sudo demoting themselves or others)
  try {
    await sock.groupParticipantsUpdate(jid, [target], 'demote')
    return reply({
      text: 
        '⬇️ *DEMOTED*\n' +
        '✅ @' + targetNum + ' has been demoted!\n' +
        '',
      mentions: [target],
    })
  } catch (err) {
    return reply('❌ Failed to demote: ' + err.message)
  }
}
