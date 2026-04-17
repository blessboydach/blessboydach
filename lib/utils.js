// ============================================================
//  VANGUARD MD — lib/utils.js
//  Shared helper functions used across the bot
// ============================================================

const fs = require('fs')
const path = require('path')
const config = require('../config')
const defaults = require('../defaults')

// ── Format seconds to readable uptime ────────────────────────
const formatUptime = (seconds) => {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const parts = []
  if (d) parts.push(`${d}d`)
  if (h) parts.push(`${h}h`)
  if (m) parts.push(`${m}m`)
  parts.push(`${s}s`)
  return parts.join(' ')
}

// ── Format bytes to readable size ────────────────────────────
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

// ── Get current Nairobi time ──────────────────────────────────
const getNairobiTime = () => {
  return new Date().toLocaleString('en-KE', {
    timeZone: 'Africa/Nairobi',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })
}

// ── Sleep helper ──────────────────────────────────────────────
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// ── Random integer between min and max ───────────────────────
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

// ── Random item from array ────────────────────────────────────
const randItem = (arr) => arr[Math.floor(Math.random() * arr.length)]

// ── Check if number is valid WhatsApp JID ─────────────────────
const isValidJid = (jid) => {
  return /^\d+@(s\.whatsapp\.net|g\.us)$/.test(jid)
}

// ── Clean JID to number ───────────────────────────────────────
const jidToNum = (jid) => {
  if (!jid) return ''
  return jid.replace(/:[0-9]+/, '').replace(/@.+/, '')
}

// ── Number to JID ─────────────────────────────────────────────
const numToJid = (num) => {
  const clean = num.replace(/[^0-9]/g, '')
  return `${clean}@s.whatsapp.net`
}

// ── Extract all matchable forms from a JID ───────────────────
const extractJidForms = (jid) => {
  if (!jid) return { full: '', base: '', numeric: '' }
  const full    = jid
  const base    = jid.includes('@') ? jid.split('@')[0] : jid
  const numeric = base.includes(':') ? base.split(':')[0] : base
  return { full, base, numeric }
}

// ── Check if bot is admin in group ───────────────────────────
const isBotAdmin = async (sock, groupJid) => {
  try {
    const meta         = await sock.groupMetadata(groupJid)
    const participants = meta.participants || []
    const bot    = extractJidForms(sock.user?.id  || '')
    const botLid = extractJidForms(sock.user?.lid || '')

    return participants.some(p => {
      const pId  = extractJidForms(p.id  || '')
      const pLid = extractJidForms(p.lid || '')

      const isBot = (
        bot.full       === pId.full      ||
        bot.full       === pLid.full     ||
        botLid.full    === pLid.full     ||
        botLid.numeric === pLid.numeric  ||
        botLid.base    === pLid.numeric  ||
        bot.numeric    === pId.numeric   ||
        bot.numeric    === pLid.numeric  ||
        bot.numeric    === (p.phoneNumber ? p.phoneNumber.split('@')[0] : '')
      )

      return isBot && (p.admin === 'admin' || p.admin === 'superadmin')
    })
  } catch { return false }
}

// ── Check if sender is admin in group ────────────────────────
const isSenderAdmin = async (sock, groupJid, senderJid) => {
  try {
    const meta         = await sock.groupMetadata(groupJid)
    const participants = meta.participants || []
    const sender = extractJidForms(senderJid)

    return participants.some(p => {
      const pId  = extractJidForms(p.id  || '')
      const pLid = extractJidForms(p.lid || '')

      const match = (
        sender.full    === pId.full     ||
        sender.full    === pLid.full    ||
        sender.numeric === pId.numeric  ||
        sender.numeric === pLid.numeric ||
        sender.base    === pId.numeric  ||
        sender.numeric === (p.phoneNumber ? p.phoneNumber.split('@')[0] : '')
      )

      return match && (p.admin === 'admin' || p.admin === 'superadmin')
    })
  } catch { return false }
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

// ── Save group settings ───────────────────────────────────────
const saveGroupSettings = (groupId, settings) => {
  try {
    const dir = path.join(__dirname, '..', 'groupstore', groupId)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const file     = path.join(dir, 'groupsettings.json')
    const existing = getGroupSettings(groupId)
    fs.writeFileSync(file, JSON.stringify({ ...existing, ...settings }, null, 2))
    return true
  } catch { return false }
}

// ── Warn store ────────────────────────────────────────────────
// Structure per user: { "antilink": { count: 2 }, "antisticker": { count: 1 } }
// Each violation type has its OWN independent counter!
// User entry deleted entirely when kicked
const getWarns = (groupId) => {
  try {
    const file = path.join(__dirname, '..', 'groupstore', groupId, 'warns.json')
    if (!fs.existsSync(file)) return {}
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch { return {} }
}

const saveWarns = (groupId, data) => {
  try {
    const dir = path.join(__dirname, '..', 'groupstore', groupId)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'warns.json'), JSON.stringify(data, null, 2))
    return true
  } catch { return false }
}

// ── Add warn — per violation type, returns TYPE-specific count ─
const addWarn = (groupId, userNum, reason = 'violation') => {
  const data = getWarns(groupId)
  if (!data[userNum]) data[userNum] = {}
  if (!data[userNum][reason]) data[userNum][reason] = { count: 0 }
  data[userNum][reason].count++
  saveWarns(groupId, data)
  return data[userNum][reason].count  // ← type-specific only!
}

// ── Get warn count ─────────────────────────────────────────────
// With reason = specific type count
// Without reason = total across all types
const getWarnCount = (groupId, userNum, reason = null) => {
  const data = getWarns(groupId)
  if (!data[userNum]) return 0
  if (reason) return data[userNum][reason]?.count || 0
  return Object.values(data[userNum]).reduce((sum, v) => sum + (v.count || 0), 0)
}

// ── Reset warns ───────────────────────────────────────────────
// With reason = reset only that violation type
// Without reason = delete entire user entry (use after kick)
const resetWarns = (groupId, userNum, reason = null) => {
  const data = getWarns(groupId)
  if (!data[userNum]) return
  if (reason) {
    delete data[userNum][reason]
    // If no violation types left — clean up user entry
    if (Object.keys(data[userNum]).length === 0) {
      delete data[userNum]
    }
  } else {
    // Full reset — called after kick
    delete data[userNum]
  }
  saveWarns(groupId, data)
}

// ── Legacy setWarnCount — kept for backwards compat ──────────
const setWarnCount = (groupId, userNum, count) => {
  const data = getWarns(groupId)
  if (count <= 0) {
    delete data[userNum]
  } else {
    if (!data[userNum]) data[userNum] = {}
    if (!data[userNum].violation) data[userNum].violation = { count: 0 }
    data[userNum].violation.count = count
  }
  saveWarns(groupId, data)
  return true
}

// ── Economy helpers ───────────────────────────────────────────
const getEconomy = () => {
  try {
    const file = path.join(__dirname, '..', 'data', 'economy.json')
    if (!fs.existsSync(file)) return {}
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch { return {} }
}

const saveEconomy = (data) => {
  try {
    const file = path.join(__dirname, '..', 'data', 'economy.json')
    fs.writeFileSync(file, JSON.stringify(data, null, 2))
    return true
  } catch { return false }
}

const getBalance = (userNum) => {
  const data = getEconomy()
  if (!data[userNum]) {
    data[userNum] = {
      balance:   config.startingBalance || defaults.startingBalance,
      lastDaily: null,
      lastWork:  null,
    }
    saveEconomy(data)
  }
  return data[userNum]
}

const setBalance = (userNum, amount) => {
  const data = getEconomy()
  if (!data[userNum]) {
    data[userNum] = {
      balance:   config.startingBalance || defaults.startingBalance,
      lastDaily: null,
      lastWork:  null,
    }
  }
  data[userNum].balance = amount
  saveEconomy(data)
}

// ── Read JSON data file ───────────────────────────────────────
const readData = (filename) => {
  try {
    const file = path.join(__dirname, '..', 'data', filename)
    if (!fs.existsSync(file)) return []
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch { return [] }
}

// ── Check single emoji only ───────────────────────────────────
const isSingleEmoji = (str) => {
  const blocked = ['❤️‍🩹', '❤️‍🔥', '👋🏾', '🤲🏾']
  if (blocked.some(e => str.includes(e))) return false
  const segments = [...new Intl.Segmenter().segment(str)]
  return segments.length === 1
}

// ── Mention format ────────────────────────────────────────────
const mentionUser = (jid) => `@${jidToNum(jid)}`

module.exports = {
  formatUptime,
  formatBytes,
  getNairobiTime,
  sleep,
  randInt,
  randItem,
  isValidJid,
  jidToNum,
  numToJid,
  extractJidForms,
  isBotAdmin,
  isSenderAdmin,
  getGroupSettings,
  saveGroupSettings,
  getWarns,
  saveWarns,
  addWarn,
  getWarnCount,
  resetWarns,
  setWarnCount,
  getEconomy,
  saveEconomy,
  getBalance,
  setBalance,
  readData,
  isSingleEmoji,
  mentionUser,
}
