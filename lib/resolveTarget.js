// ============================================================
//  VANGUARD MD — lib/resolveTarget.js
//  Shared LID-safe target resolver for addsudo/ban/etc
//  Returns { num } or { num: null, wasLid: true }
// ============================================================

const { jidToNum } = require('./utils')

// Resolve @lid → real @s.whatsapp.net via group metadata
const resolveLid = async (sock, rawJid, groupJid) => {
  if (!rawJid) return null
  const stripped = rawJid.replace(/:[0-9]+@/, '@')
  if (!stripped.endsWith('@lid')) return stripped
  if (!groupJid?.endsWith('@g.us')) return null
  try {
    const meta   = await sock.groupMetadata(groupJid)
    const lidNum = stripped.split('@')[0].split(':')[0]
    const match  = (meta.participants || []).find(p => {
      const pLid = (p.lid || '').replace(/:[0-9]+@/, '@').split('@')[0].split(':')[0]
      return pLid === lidNum
    })
    if (match?.id) return match.id.replace(/:[0-9]+@/, '@')
  } catch (_) {}
  return null  // could not resolve
}

const resolveTarget = async (args, quoted, msg, sock, jid) => {
  const botNum = jidToNum(sock.user?.id || '')

  // ── Typed number ─────────────────────────────────────────
  if (args?.[0]) {
    const num = args[0].replace(/[^0-9]/g, '').trim()
    if (num.length >= 7 && num !== botNum) return { num }
  }

  // ── Mention tag — always real JID from WA ────────────────
  const m = msg.message || {}
  for (const key of Object.keys(m)) {
    const mentions = m[key]?.contextInfo?.mentionedJid || []
    for (const mention of mentions) {
      const num = jidToNum(mention)
      if (num && num !== botNum && num.length >= 7) return { num }
    }
  }

  // ── Quoted sender — may be @lid ───────────────────────────
  if (quoted?.sender) {
    const resolved = await resolveLid(sock, quoted.sender, jid)
    if (resolved === null) return { num: null, wasLid: true }  // unresolvable lid
    const num = jidToNum(resolved)
    if (num && num !== botNum && num.length >= 7) return { num }
  }

  return { num: null }
}

module.exports = { resolveTarget, resolveLid }
