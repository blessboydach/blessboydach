// ============================================================
//  VANGUARD MD — commands/add.js
//  Sudo = God Mode + Works Without Admin 🗿
// ============================================================

const { isBotAdmin, numToJid, jidToNum } = require('../lib/utils')

module.exports = async (ctx) => {
  const { reply, sock, jid, fromGroup, args, isSudo, sender } = ctx

  // STEP 1: Must be in group
  if (!fromGroup) return reply('❌ This command can only be used in groups!')

  // STEP 2: Only sudo/owner can use (even admins can't misuse!)
  if (!isSudo) {
    return reply('❌ Only owner and sudo users can use this command!')
  }

  // STEP 3: SUDO MODE - Try to add regardless of bot admin status
  // In some groups, everyone can add! Don't block sudo unnecessarily
  const botAdmin = await isBotAdmin(sock, jid)
  
  // If bot is admin = guaranteed to work
  // If bot is NOT admin = might still work (group settings allow all to add)
  // Either way, let sudo try!

  const number = args[0]?.replace(/[^0-9]/g, '')
  if (!number) {
    return reply('❌ Provide a number to add!\n_Example: .add +256745626308_')
  }

  const targetJid = numToJid(number)

  try {
    const result = await sock.groupParticipantsUpdate(jid, [targetJid], 'add')
    const status = result?.[0]?.status

    if (status === '200') {
      return reply(
        '➕ *ADDED*\n' +
        '✅ *+' + number + '* has been added!\n' +
        (botAdmin ? '' : 'ℹ️ _Added without admin rights (group allows it)_\n') +
        ''
      )
    } else if (status === '403') {
      return reply(
        '➕ *ADD*\n' +
        '❌ *+' + number + '* has privacy settings on\n' +
        'ℹ️ _They need to join via invite link_\n' +
        ''
      )
    } else if (status === '409') {
      return reply(
        '➕ *ADD*\n' +
        '😌 *+' + number + '* is already in the group!\n' +
        ''
      )
    } else {
      // Failed - might need admin rights
      return reply(
        '➕ *ADD*\n' +
        '⚠️ Could not add *+' + number + '*\n' +
        (botAdmin ? '❌ _Unknown error (status: ' + status + ')_\n' : 'ℹ️ _I may need admin rights in this group_\n') +
        ''
      )
    }
  } catch (err) {
    // If error and not admin, suggest making admin
    return reply(
      '➕ *ADD*\n' +
      '❌ Failed to add: ' + err.message + '\n' +
      (botAdmin ? '' : 'ℹ️ _Try making me an admin, or check if group allows member invites_\n') +
      ''
    )
  }
}
