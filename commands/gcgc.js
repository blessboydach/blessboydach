// ============================================================
// VANGUARD MD — commands/gcgc.js
// Common Groups Intelligence | .gcgc + .gcgc2
// Clean | Accurate | Non-Spam
// ============================================================

// ── Group cache (15s) ───────────────────────────────────────
let groupCache = null
let groupCacheTime = 0
const CACHE_TTL = 15000

const getGroups = async (sock) => {
  const now = Date.now()

  if (groupCache && now - groupCacheTime < CACHE_TTL) {
    return groupCache
  }

  groupCache = await sock.groupFetchAllParticipating()
  groupCacheTime = now

  setTimeout(() => {
    groupCache = null
    groupCacheTime = 0
  }, CACHE_TTL)

  return groupCache
}

// ── Normalize any jid/number to digits only ─────────────────
const normalize = (input) => {
  if (!input) return ''

  return String(input)
    .replace(/:[0-9]+@/, '@')   // remove device id
    .replace(/@.+/, '')         // remove domain
    .replace(/[^0-9]/g, '')     // digits only
    .trim()
}

// ── Resolve target ──────────────────────────────────────────
const resolveTarget = (args, quoted, msg, sock) => {

  const botNum = normalize(sock.user?.id)

  // ARG number
  if (args[0]) {
    const num = normalize(args[0])

    if (num && num.length >= 7 && num !== botNum) {
      return num
    }
  }

  // QUOTED
  if (quoted?.sender) {
    const num = normalize(quoted.sender)

    if (num && num !== botNum) {
      return num
    }
  }

  // MENTIONS
  const m = msg.message || {}

  for (const key of Object.keys(m)) {

    const mentions = m[key]?.contextInfo?.mentionedJid
    if (!mentions) continue

    for (const jid of mentions) {
      const num = normalize(jid)

      if (num && num !== botNum) {
        return num
      }
    }
  }

  return null
}

// ── Command ─────────────────────────────────────────────────
module.exports = async (ctx) => {

  const { sock, msg, jid, reply, args, quoted, command } = ctx

  const isShort = command === "gcgc2"

  const targetNum = resolveTarget(args, quoted, msg, sock)

  if (!targetNum) {
    return reply(
      "👥 *GCGC*\n❌ No target provided\nUsage:\n.gcgc @user\n.gcgc 256xxxxxxxx"
    )
  }

  // scanning message
  await reply(`👥 *GCGC*\n⏳ Scanning +${targetNum}...`)

  let groups

  try {
    groups = await Promise.race([
      getGroups(sock),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 15000)
      )
    ])
  } catch {
    return reply("👥 *GCGC*\n❌ Failed to fetch groups")
  }

  const results = []

  // scan groups
  for (const [, meta] of Object.entries(groups)) {

    const participants = meta.participants || []

    const found = participants.find(p => {

      const idNum = normalize(p.id)
      const lidNum = normalize(p.lid)

      return idNum === targetNum || lidNum === targetNum
    })

    if (found) {
      results.push({
        name: meta.subject,
        admin: found.admin === "admin" || found.admin === "superadmin"
      })
    }
  }

  if (!results.length) {
    return reply(`👥 *GCGC*\n😶 No common groups with +${targetNum}`)
  }

  const list = results
    .map(g => `${g.admin ? "👑" : "👥"} ${g.name}`)
    .join("\n")

  if (isShort) {

    return reply(
      `👥 *GCGC2 | +${targetNum}*\n` +
      `📊 ${results.length} common groups\n${list}`
    )
  }

  return reply(
    `👥 *GCGC | +${targetNum}*\n` +
    `📊 Found in *${results.length}* groups\n` +
    `*Common groups:*\n${list}`
  )
}