// ============================================================
//  VANGUARD MD — lib/groupEvents.js
//  Group join/leave/promote/demote event handler
// ============================================================

const fs = require('fs')
const path = require('path')
const config   = require('../config')
const defaults = require('../defaults')
const logger = require('./logger')
const { jidToNum, isBotAdmin } = require('./utils')

// ── Safe JID extractor ────────────────────────────────────────
const safeJid = (p) => {
  if (!p) return ''
  if (typeof p === 'string') return p
  return p.id || p.jid || String(p)
}

// ── Get group settings ────────────────────────────────────────
const getGroupSettings = (groupId) => {
  try {
    const dir  = path.join(__dirname, '..', 'groupstore', groupId)
    const file = path.join(dir, 'groupsettings.json')
    if (!fs.existsSync(file)) return {}
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch { return {} }
}

// ── Replace variables in message ──────────────────────────────
const processVars = (template, vars) => {
  return template
    .replace(/\{user\}/g,  vars.user  || '')
    .replace(/\{group\}/g, vars.group || '')
    .replace(/\{desc\}/g,  vars.desc  || '')
    .replace(/\{count\}/g, vars.count || '')
}

// ── Format participant list ───────────────────────────────────
const formatParticipants = (participants) => {
  return participants.map(p => `+${jidToNum(safeJid(p))}`).join(', ')
}

// ── Main group event handler ──────────────────────────────────
const handleGroupEvents = async (sock, update) => {
  const { id: groupJid, participants, action } = update

  try {
    let groupMeta = null
    try {
      groupMeta = await sock.groupMetadata(groupJid)
    } catch (_) {}

    const groupName = groupMeta?.subject || groupJid
    const groupDesc = groupMeta?.desc || ''
    const settings  = getGroupSettings(groupJid)
    const botNum    = jidToNum(sock.user.id)

    logger.group(`👥 [${groupName}] ${action} — ${formatParticipants(participants)}`)

    // ── ALL events ask utils.js if bot is admin ───────────────
    const botAdmin = await isBotAdmin(sock, groupJid)
    if (!botAdmin) {
      logger.group(`🔇 [${groupName}] ${action} — bot not admin, skipped`)
      return
    }

    switch (action) {

      // ── Member joined ─────────────────────────────────────────
      case 'add': {
        if (!settings.welcome) break

        for (const p of participants) {
          const participant = safeJid(p)
          const num         = jidToNum(participant)
          const count       = groupMeta?.participants?.length || 0

          let ppUrl = null
          try {
            ppUrl = await sock.profilePictureUrl(participant, 'image')
          } catch (_) {}

          const template = settings.welcomeMsg ||
            '╭───────────────━⊷\n' +
            '┃ 👋 *WELCOME*\n' +
            '╰───────────────━⊷\n' +
            '╭───────────────━⊷\n' +
            '┃ 🎉 {user} Welcome to\n' +
            '┃ *{group}*!\n' +
            '┃\n' +
            '┃ 👥 *Members:* {count}\n' +
            (groupDesc ? '┃ 📌 *About:* {desc}\n' : '') +
            '╰───────────────━⊷'

          const finalMsg = processVars(template, {
            user:  '@' + num,
            group: groupName,
            desc:  groupDesc,
            count: String(count),
          })

          try {
            if (ppUrl) {
              await sock.sendMessage(groupJid, {
                image:    { url: ppUrl },
                caption:  finalMsg,
                mentions: [participant],
              })
            } else {
              await sock.sendMessage(groupJid, {
                text:     finalMsg,
                mentions: [participant],
              })
            }
          } catch (_) {
            await sock.sendMessage(groupJid, {
              text:     finalMsg,
              mentions: [participant],
            }).catch(() => {})
          }

          logger.group(`✅ Welcomed ${num} to ${groupName}`)
        }
        break
      }

      // ── Member left / was removed ─────────────────────────────
      case 'remove': {
        if (!settings.goodbye) break

        for (const p of participants) {
          const participant = safeJid(p)
          const num         = jidToNum(participant)
          const count       = (groupMeta?.participants?.length || 1) - 1

          if (num === botNum) {
            logger.warn(`⚠️  Bot was removed from group: ${groupName}`)
            break
          }

          const template = settings.goodbyeMsg ||
            '╭───────────────━⊷\n' +
            '┃ 👋 *GOODBYE*\n' +
            '╰───────────────━⊷\n' +
            '╭───────────────━⊷\n' +
            '┃ 😢 {user} has left\n' +
            '┃ *{group}*\n' +
            '┃ 👥 *Remaining:* {count}\n' +
            '╰───────────────━⊷'

          const finalMsg = processVars(template, {
            user:  '@' + num,
            group: groupName,
            desc:  groupDesc,
            count: String(count),
          })

          try {
            await sock.sendMessage(groupJid, {
              text:     finalMsg,
              mentions: [participant],
            })
          } catch (_) {}

          logger.group(`👋 ${num} left ${groupName}`)
        }
        break
      }

      // ── Member promoted ───────────────────────────────────────
      case 'promote': {
        const actorRaw = safeJid(update.author || '')
        const actorNum = actorRaw ? jidToNum(actorRaw) : ''

        for (const p of participants) {
          const participant = safeJid(p)
          const num         = jidToNum(participant)

          if (num === botNum) {
            logger.success(`🌟 Bot promoted to admin in ${groupName}`)
            try {
              await sock.sendMessage(groupJid, {
                text: '✅ *Thank you for making me admin!*\n_I will now manage the group better._'
              })
            } catch (_) {}
            break
          }

          const mentions = (actorRaw && actorRaw !== participant)
            ? [participant, actorRaw]
            : [participant]

          const actorLine = actorNum
            ? '┃ 👤 *By:* @' + actorNum + '\n'
            : ''

          try {
            await sock.sendMessage(groupJid, {
              text:
                '╭───────────────━⊷\n' +
                '┃ ⭐ *PROMOTED*\n' +
                '╰───────────────━⊷\n' +
                '╭───────────────━⊷\n' +
                '┃ 🎉 @' + num + ' is now an admin!\n' +
                actorLine +
                '╰───────────────━⊷',
              mentions,
            })
          } catch (_) {}

          logger.group(`⭐ ${num} promoted in ${groupName}` + (actorNum ? ` by ${actorNum}` : ''))
        }
        break
      }

      // ── Member demoted ────────────────────────────────────────
      case 'demote': {
        const actorRaw = safeJid(update.author || '')
        const actorNum = actorRaw ? jidToNum(actorRaw) : ''

        for (const p of participants) {
          const participant = safeJid(p)
          const num         = jidToNum(participant)

          if (num === botNum) {
            logger.warn(`⚠️  Bot demoted in group: ${groupName}`)
            
            const { pauseAndClear } = require('./activeHelper')
            pauseAndClear(groupJid)
            
            try {
              await sock.sendMessage(groupJid, {
                text: '⚠️ *I have been demoted from admin.*\n_Some features will not work._'
              })
            } catch (_) {}
            break
          }

          const mentions = (actorRaw && actorRaw !== participant)
            ? [participant, actorRaw]
            : [participant]

          const actorLine = actorNum
            ? '┃ 👤 *By:* @' + actorNum + '\n'
            : ''

          try {
            await sock.sendMessage(groupJid, {
              text:
                '╭───────────────━⊷\n' +
                '┃ 🔽 *DEMOTED*\n' +
                '╰───────────────━⊷\n' +
                '╭───────────────━⊷\n' +
                '┃ 📉 @' + num + ' has been demoted.\n' +
                actorLine +
                '╰───────────────━⊷',
              mentions,
            })
          } catch (_) {}

          logger.group(`🔽 ${num} demoted in ${groupName}` + (actorNum ? ` by ${actorNum}` : ''))
        }
        break
      }

      default:
        logger.debug(`❓ Unknown group action: ${action}`)
        break
    }

  } catch (err) {
    logger.error(`👥 Group event error: ${err.message}`)
  }
}

module.exports = { handleGroupEvents }
