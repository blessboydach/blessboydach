// ============================================================
//  VANGUARD MD — commands/kick.js
//  Sudo/Admins/Owner Can Kick + Self-Kick = Bot Leaves 🗿
// ============================================================

const { isBotAdmin, isSenderAdmin, jidToNum } = require('../lib/utils')

module.exports = async (ctx) => {
  const { reply, sock, jid, fromGroup, sender, mentions, quoted, isSudo } = ctx

  // STEP 1: Must be in group
  if (!fromGroup) return reply('❌ This command can only be used in groups!')

  // STEP 2: Check if sender is OWNER/SUDO/ADMIN
  // First check sudo (fastest), then check admin status
  let senderIsAdmin = false
  
  if (!isSudo) {
    // Not sudo? Must be admin!
    senderIsAdmin = await isSenderAdmin(sock, jid, sender)
    if (!senderIsAdmin) {
      return reply('❌ Only admins can use this command!')
    }
  }

  // STEP 3: CRITICAL — Bot MUST be admin to kick anyone
  // This applies to EVERYONE (sudo, owner, admins)
  const botAdmin = await isBotAdmin(sock, jid)
  if (!botAdmin) {
    return reply(
      '👢 *KICK*\n' +
      '❌ *I need to be an admin first!*\n' +
      '_Make me an admin before kicking members_\n' +
      ''
    )
  }

  // STEP 4: Get target
  let target = mentions?.[0] || null
  if (!target && quoted?.sender) target = quoted.sender
  
  if (!target) {
    return reply('❌ Mention or reply to someone!\n_Example: .kick @user_')
  }

  // STEP 5: Normalize JIDs for comparison
  const normalize   = (j) => (j || '').replace(/:[0-9]+@/, '@')
  const botJid      = normalize(sock.user?.id)
  const targetClean = normalize(target)
  const senderClean = normalize(sender)

  // STEP 6: Bot or self targeted — silent leave 🗿
  if (targetClean === botJid || targetClean === senderClean) {
    try { 
      await sock.groupLeave(jid) 
      logger.info(`👢 Left group ${jid} (kick command targeted bot/self)`)
    } catch (_) {}
    return
  }

  // STEP 7: Check if target is creator (can't kick creator)
  try {
    const meta    = await sock.groupMetadata(jid)
    const creator = meta.participants.find(p => p.admin === 'superadmin')
    if (creator && normalize(creator.id) === targetClean) {
      return reply('❎ _Mission Failure: Cannot kick group creator_')
    }
  } catch (_) {}

  const targetNum = jidToNum(target)

  // STEP 8: Execute kick
  try {
    await sock.groupParticipantsUpdate(jid, [target], 'remove')
    return reply({
      text: 
        '👢 *KICKED*\n' +
        '✅ @' + targetNum + ' has been removed!\n' +
        '',
      mentions: [target],
    })
  } catch (err) {
    return reply('❌ Failed to kick: ' + err.message)
  }
}
