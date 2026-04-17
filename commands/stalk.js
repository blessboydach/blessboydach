// ============================================================
//  VANGUARD MD — commands/stalk.js
//  Full number intelligence — DP + Bio + Common Groups
// ============================================================

const fs   = require('fs')
const path = require('path')

const NO_DP = path.join(__dirname, '..', 'assets', 'nodp.jpeg')

// ── Reuse gcgc group cache ────────────────────────────────────
let groupCache     = null
let groupCacheTime = 0
const CACHE_TTL    = 15000

const getGroups = async (sock) => {
  const now = Date.now()
  if (groupCache && (now - groupCacheTime) < CACHE_TTL) return groupCache
  groupCache     = await sock.groupFetchAllParticipating()
  groupCacheTime = Date.now()
  setTimeout(() => { groupCache = null; groupCacheTime = 0 }, CACHE_TTL)
  return groupCache
}

// ── Resolve target ────────────────────────────────────────────
const resolveTarget = (args, quoted, msg) => {
  if (args[0]) {
    const num = args[0].replace(/[^0-9]/g, '').trim()
    if (num.length >= 7) return num + '@s.whatsapp.net'
  }
  if (quoted?.sender) {
    const s = quoted.sender.replace(/:[0-9]+@/, '@')
    if (s.endsWith('@s.whatsapp.net')) return s
  }
  const m = msg.message
  for (const key of Object.keys(m || {})) {
    const mentions = m[key]?.contextInfo?.mentionedJid
    if (mentions?.length) return mentions[0]
  }
  return null
}

module.exports = async (ctx) => {
  const { sock, msg, jid, reply, args, quoted } = ctx

  // ── Resolve target ────────────────────────────────────────
  const targetJid = resolveTarget(args, quoted, msg)
  if (!targetJid) {
    return reply(
      '╭───────────────━⊷\n' +
      '┃ 🔍 *STALK*\n' +
      '╰───────────────━⊷\n' +
      '╭───────────────━⊷\n' +
      '┃ ❌ *No target found!*\n' +
      '┃ _Tag, reply or provide number_\n' +
      '┃ _Example: .stalk 256787287967_\n' +
      '╰───────────────━⊷'
    )
  }

  const targetNum = targetJid
    .replace('@s.whatsapp.net', '')
    .replace(/:[0-9]+@/, '')
    .trim()

  // ── Check if on WhatsApp ──────────────────────────────────
  try {
    const result = await sock.onWhatsApp(targetJid)
    if (!result?.[0]?.exists) {
      return reply(
        '╭───────────────━⊷\n' +
        '┃ 🔍 *STALK*\n' +
        '╰───────────────━⊷\n' +
        '╭───────────────━⊷\n' +
        '┃ ❌ *+' + targetNum + '* is not on WhatsApp!\n' +
        '╰───────────────━⊷'
      )
    }
  } catch (_) {}

  // ── Waiting message ───────────────────────────────────────
  await reply(
    '╭───────────────━⊷\n' +
    '┃ 🔍 *STALK*\n' +
    '╰───────────────━⊷\n' +
    '╭───────────────━⊷\n' +
    '┃ ⏳ *Gathering intelligence...*\n' +
    '┃ _+' + targetNum + '_\n' +
    '╰───────────────━⊷'
  )

  // ── Run all fetches in parallel ───────────────────────────
  const [ppResult, bioResult, groupsResult] = await Promise.allSettled([

    // ── Profile picture ──────────────────────────────────
    sock.profilePictureUrl(targetJid, 'image').catch(() => null),

    // ── Bio / About ───────────────────────────────────────
    sock.fetchStatus(targetJid).catch(() => null),

    // ── Common groups with 15s timeout ────────────────────
    Promise.race([
      getGroups(sock),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 15000)
      )
    ]).catch(() => null),
  ])

  const ppUrl    = ppResult.status    === 'fulfilled' ? ppResult.value    : null
  const bioData  = bioResult.status   === 'fulfilled' ? bioResult.value   : null
  const groups   = groupsResult.status === 'fulfilled' ? groupsResult.value : null

  const bio = bioData?.status || bioData?.text || null

  // ── Find common groups ────────────────────────────────────
  const commonGroups = []
  if (groups) {
    for (const [groupJid, meta] of Object.entries(groups)) {
      const inGroup = (meta.participants || []).some(p => {
        const pJid = (p.id || '').replace(/:[0-9]+@/, '@')
        return pJid === targetJid || pJid.startsWith(targetNum + '@')
      })
      if (inGroup) {
        // ── Check if admin ─────────────────────────────────
        const participant = (meta.participants || []).find(p => {
          const pJid = (p.id || '').replace(/:[0-9]+@/, '@')
          return pJid === targetJid || pJid.startsWith(targetNum + '@')
        })
        const isAdmin = participant?.admin === 'admin' || participant?.admin === 'superadmin'
        commonGroups.push({
          name:    meta.subject,
          isAdmin,
          members: meta.participants?.length || 0,
        })
      }
    }
  }

  // ── Build report ──────────────────────────────────────────
  const groupLines = commonGroups.length
    ? commonGroups.map(g =>
        '┃ ' + (g.isAdmin ? '👑' : '👥') + ' ' + g.name + ' _(' + g.members + ' members)_'
      ).join('\n')
    : '┃ _No common groups_'

  const report =
    '╭───────────────━⊷\n' +
    '┃ 🔍 *STALK REPORT*\n' +
    '╰───────────────━⊷\n' +
    '╭───────────────━⊷\n' +
    '┃ 📱 *Number:* +' + targetNum + '\n' +
    '┃ 💬 *Bio:* ' + (bio || '_No bio set_') + '\n' +
    '┃ 🖼️ *DP:* ' + (ppUrl ? 'Found ✅' : 'None ❌') + '\n' +
    '┃\n' +
    '┃ 👥 *Common Groups:* ' + commonGroups.length + '\n' +
    groupLines + '\n' +
    '╰───────────────━⊷'

  // ── Send with DP or nodp.jpeg ─────────────────────────────
  try {
    if (ppUrl) {
      await sock.sendMessage(jid, {
        image:    { url: ppUrl },
        caption:  report,
        mentions: [targetJid],
      }, { quoted: msg })
    } else {
      // ── Use nodp.jpeg from assets ─────────────────────
      const nodpBuffer = fs.existsSync(NO_DP)
        ? fs.readFileSync(NO_DP)
        : null

      if (nodpBuffer) {
        await sock.sendMessage(jid, {
          image:    nodpBuffer,
          caption:  report,
          mentions: [targetJid],
        }, { quoted: msg })
      } else {
        await sock.sendMessage(jid, {
          text:     report,
          mentions: [targetJid],
        }, { quoted: msg })
      }
    }
  } catch (err) {
    await reply(report)
  }
}
