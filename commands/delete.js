// ============================================================
//  VANGUARD MD — commands/delete.js
// ============================================================

const { isBotAdmin } = require('../lib/utils')
const { getStoredMessages } = require('../lib/messageStore')

const MAX_BULK = 100

module.exports = async (ctx) => {
  const { sock, msg, jid, reply, quoted, args, fromGroup, fromMe, isSudo, senderNum, mentions, prefix } = ctx

  if (!isSudo) return reply('❌ Only sudo/owner can use this command!')

  const firstArg  = args[0]
  const bulkCount = firstArg && /^\d+$/.test(firstArg) ? parseInt(firstArg) : null

  const deleteMsg = async (msgKey) => {
    try { await sock.sendMessage(jid, { delete: msgKey }); return true }
    catch (_) { return false }
  }

  const deleteCommand = async () => {
    try {
      await sock.sendMessage(jid, {
        delete: { remoteJid: jid, id: msg.key.id, fromMe: true }
      })
    } catch (_) {}
  }

  // ════════════════════════════════════════════════════════
  //  MODE 1 — Quoted delete
  // ════════════════════════════════════════════════════════
  if (quoted && !bulkCount) {
    const isOwnMsg = quoted.sender
      ? quoted.sender.replace(/:[0-9]+@/, '@').replace('@s.whatsapp.net', '') === senderNum
      : false

    if (isOwnMsg || fromMe) {
      const ok = await deleteMsg({
        remoteJid: jid, id: quoted.stanzaId, fromMe: true, participant: quoted.sender,
      })
      if (!ok) await deleteMsg({
        remoteJid: jid, id: quoted.stanzaId, fromMe: false, participant: quoted.sender,
      })
      await deleteCommand()
      return
    }

    if (fromGroup) {
      const botAdmin = await isBotAdmin(sock, jid)
      if (!botAdmin) return reply('❌ I need to be an admin to delete others\' messages!')

      const stored = getStoredMessages(jid)
      const exists = stored?.find(m => m.id === quoted.stanzaId)
      if (!exists) return reply(
        '⚠️ *NOT IN MEMORY*\n' +
        '_This message is too old or was sent before deployement._\n' +
        ''
      )

      const ok = await deleteMsg({
        remoteJid: jid, id: quoted.stanzaId, fromMe: false, participant: quoted.sender,
      })
      if (ok) {
        await deleteCommand()
      } else {
        await reply('❌ Failed to delete — message may be too old for WhatsApp.')
      }
      return
    }

    await deleteMsg({ remoteJid: jid, id: quoted.stanzaId, fromMe: false })
    await deleteCommand()
    return
  }

  // ════════════════════════════════════════════════════════
  //  MODE 2 — Bulk delete
  // ════════════════════════════════════════════════════════
  if (bulkCount) {
    if (bulkCount > MAX_BULK) return reply('❌ Maximum bulk delete is *' + MAX_BULK + '* messages.')
    if (bulkCount < 1)        return reply('❌ Please provide a valid number.')

    if (fromGroup) {
      const botAdmin = await isBotAdmin(sock, jid)
      if (!botAdmin) return reply('❌ I need to be an admin to bulk delete messages!')
    }

    let targetNum = null
    if (mentions?.length) {
      targetNum = mentions[0].replace(/:[0-9]+@/, '@').replace('@s.whatsapp.net', '')
    } else if (quoted?.sender) {
      targetNum = quoted.sender.replace(/:[0-9]+@/, '@').replace('@s.whatsapp.net', '')
    }

    const stored = getStoredMessages(jid) || []
    if (stored.length === 0) return reply(
      '⚠️ *NO MESSAGES IN MEMORY*\n' +
      '_Messages sent before deployment can\'t be recovered._\n' +
      ''
    )

    const pool = targetNum
      ? stored.filter(m => {
          const mNum = (m.sender || '').replace(/:[0-9]+@/, '@').replace('@s.whatsapp.net', '')
          return mNum === targetNum
        })
      : stored

    if (pool.length === 0) return reply('⚠️ *No messages found for that user in  memory.*')

    const toDelete   = pool.slice(-bulkCount)
    const requested  = toDelete.length

    let deleted = 0
    let failed  = 0

    for (const m of toDelete) {
      try {
        await sock.sendMessage(jid, {
          delete: { remoteJid: jid, id: m.id, fromMe: m.fromMe ?? false, participant: m.sender }
        })
        deleted++
      } catch (_) { failed++ }
      await new Promise(r => setTimeout(r, 100))
    }

    await deleteCommand()

    await sock.sendMessage(jid, {
      text:
        '🗑️ *BULK DELETE COMPLETE*\n' +
        '✅ *Deleted:* ' + deleted + '/' + requested + '\n' +
        (targetNum ? '👤 *Target:* @' + targetNum + '\n' : '') +
        (failed > 0 ? '⚠️ *Failed:* ' + failed + ' (too old for WhatsApp)\n' : '') +
        '',
      mentions: targetNum ? [targetNum + '@s.whatsapp.net'] : [],
    })
    return
  }

  // ════════════════════════════════════════════════════════
  //  No args — usage
  // ════════════════════════════════════════════════════════
  await reply(
    '🗑️ *DELETE*\n' +
    '📌 Reply to a message → *' + prefix + 'delete*\n' +
    '🗑️ Bulk delete last N → *' + prefix + 'delete 20*\n' +
    '👤 Bulk by user → *' + prefix + 'delete 20 @user*\n' +
    '_Max bulk: ' + MAX_BULK + ' messages_\n' +
    ''
  )
}
