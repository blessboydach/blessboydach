// ============================================================
//  VANGUARD MD — commands/del.js
// ============================================================

const { isBotAdmin, isSenderAdmin } = require('../lib/utils')
const { getStoredMessages } = require('../lib/messageStore')
const config   = require('../config')
const defaults = require('../defaults')

const MAX_BULK = 100

module.exports = async (ctx) => {
  const {
    sock, msg, jid, reply, quoted, args,
    fromGroup, fromMe, isSudo, senderNum, sender,
    mentions, prefix,
  } = ctx

  const mode = (config.mode || defaults.mode || 'public').toLowerCase()

  let canUse = isSudo

  if (!canUse && fromGroup && mode === 'public') {
    canUse = await isSenderAdmin(sock, jid, sender)
  }

  if (!canUse) {
    return reply('❌ Only sudo/owner can use this command')
  }

  const checkBotAdmin = async () => {
    const botAdmin = await isBotAdmin(sock, jid)
    if (!botAdmin) {
      await reply('❌ I need admin rights to delete messages')
      return false
    }
    return true
  }

  const firstArg  = args[0]
  const bulkCount = firstArg && /^\d+$/.test(firstArg) ? parseInt(firstArg) : null

  const deleteMsg = async (msgKey) => {
    try { 
      await sock.sendMessage(jid, { delete: msgKey }) 
      return true 
    } catch (_) { 
      return false 
    }
  }

  const deleteCommand = async () => {
    try {
      await sock.sendMessage(jid, {
        delete: { remoteJid: jid, id: msg.key.id, fromMe: true }
      })
    } catch (_) {}
  }

  // ── QUOTED DELETE ─────────────────────────────
  if (quoted && !bulkCount) {
    const quotedSenderNum = (quoted.sender || '')
      .replace(/:[0-9]+@/, '@')
      .replace('@s.whatsapp.net', '')

    const isOwnMsg = quotedSenderNum === senderNum || fromMe

    if (isOwnMsg) {
      const ok = await deleteMsg({
        remoteJid: jid, id: quoted.stanzaId, fromMe: true, participant: quoted.sender,
      })

      if (!ok) {
        await deleteMsg({
          remoteJid: jid, id: quoted.stanzaId, fromMe: false, participant: quoted.sender,
        })
      }

      await deleteCommand()
      return
    }

    if (fromGroup) {
      if (!(await checkBotAdmin())) return

      const stored = getStoredMessages(jid)
      const exists = stored?.find(m => m.id === quoted.stanzaId)

      if (!exists) {
        return reply('❌ Message not found in memory (too old)')
      }

      const ok = await deleteMsg({
        remoteJid: jid,
        id: quoted.stanzaId,
        fromMe: false,
        participant: quoted.sender,
      })

      if (!ok) {
        return reply('❌ Failed to delete (message too old)')
      }

      await deleteCommand()
      return
    }

    await deleteMsg({ remoteJid: jid, id: quoted.stanzaId, fromMe: false })
    await deleteCommand()
    return
  }

  // ── BULK DELETE ─────────────────────────────
  if (bulkCount) {
    if (bulkCount > MAX_BULK) return reply('❌ Max delete is ' + MAX_BULK)
    if (bulkCount < 1)        return reply('❌ Invalid number')

    if (fromGroup) {
      if (!(await checkBotAdmin())) return
    }

    let targetNum = null

    if (mentions?.length) {
      targetNum = mentions[0]
        .replace(/:[0-9]+@/, '@')
        .replace('@s.whatsapp.net', '')
    } else if (quoted?.sender) {
      targetNum = quoted.sender
        .replace(/:[0-9]+@/, '@')
        .replace('@s.whatsapp.net', '')
    }

    const stored = getStoredMessages(jid) || []

    if (!stored.length) {
      return reply('❌ No messages stored in memory')
    }

    const pool = targetNum
      ? stored.filter(m => {
          const mNum = (m.sender || '')
            .replace(/:[0-9]+@/, '@')
            .replace('@s.whatsapp.net', '')
          return mNum === targetNum
        })
      : stored

    if (!pool.length) {
      return reply('❌ No messages found for target')
    }

    const toDelete  = pool.slice(-bulkCount)
    let deleted = 0
    let failed  = 0

    for (const m of toDelete) {
      try {
        await sock.sendMessage(jid, {
          delete: {
            remoteJid: jid,
            id: m.id,
            fromMe: m.fromMe ?? false,
            participant: m.sender,
          }
        })
        deleted++
      } catch (_) {
        failed++
      }

      await new Promise(r => setTimeout(r, 80))
    }

    await deleteCommand()

    await sock.sendMessage(jid, {
      text:
        '✅ Deleted: ' + deleted + '/' + toDelete.length + '\n' +
        (failed ? '❌ Failed: ' + failed : '') +
        (targetNum ? '\n👤 @' + targetNum : ''),
      mentions: targetNum ? [targetNum + '@s.whatsapp.net'] : []
    })

    return
  }

  // ── USAGE ─────────────────────────────
  await reply(
    '❌ Reply to a message or use:\n' +
    prefix + 'del 10\n' +
    prefix + 'del 10 @user'
  )
}
