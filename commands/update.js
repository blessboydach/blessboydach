// ============================================================
// VANGUARD MD — commands/update.js
// Smart update: compare repo vs uptime → restart if needed
// ============================================================

const https = require('https')
const config = require('../config')
const defaults = require('../defaults')

const OWNER = 'blessboydach'
const REPO  = 'blessboydach'

module.exports = async (ctx) => {
  const { sock, msg, jid, reply, isSudo } = ctx

  if (!isSudo) return reply('❌ Owner only!')

  const botName = config.botName || defaults.botName || 'VANGUARD MD'

  const checkMsg = await sock.sendMessage(jid, {
    text: '⏳ Checking for updates...'
  }, { quoted: msg })

  try {
    // ── Fetch commits ─────────────────────────────
    const commits = await fetchJSON(
      `https://api.github.com/repos/${OWNER}/${REPO}/commits`
    )

    if (!Array.isArray(commits) || commits.length === 0) {
      throw new Error('No commits found')
    }

    const latestCommitTime = new Date(
      commits[0].commit.author.date
    ).getTime()

    const botStartTime = Date.now() - (process.uptime() * 1000)

    // ── Up-to-date check ──────────────────────────
    if (botStartTime > latestCommitTime) {
      return sock.sendMessage(jid, {
        text: 'System is up to date ✅',
        edit: checkMsg.key
      })
    }

    // ── Count updates ─────────────────────────────
    let updateCount = 0

    for (const c of commits) {
      const t = new Date(c.commit.author.date).getTime()
      if (t > botStartTime) updateCount++
      else break
    }

    // ── Notify + Restart ──────────────────────────
    await sock.sendMessage(jid, {
      text: `⚠️ ${updateCount} update(s) found`,
      edit: checkMsg.key
    })

    await reply(
      '❇️ ' + botName + ' is restarting to apply updates...\n' +
      '⏳ Please wait a few seconds.'
    )

    setTimeout(() => process.exit(1), 5000)

  } catch (err) {
    await sock.sendMessage(jid, {
      text: '❌ Failed: ' + err.message,
      edit: checkMsg.key
    })
  }
}

// ── Helper ───────────────────────────────────────
const fetchJSON = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { 'User-Agent': 'VanguardMD' }
    }, (res) => {

      if (res.statusCode !== 200) {
        return reject(new Error('HTTP ' + res.statusCode))
      }

      let data = ''
      res.on('data', chunk => data += chunk)

      res.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch {
          reject(new Error('Invalid JSON'))
        }
      })

    }).on('error', reject)
  })
}
