// ============================================================
//  VANGUARD MD — lib/activeHelper.js
//  Active Group Message Counter System
// ============================================================

const fs = require('fs')
const path = require('path')
const { jidToNum } = require('./utils')
const logger = require('./logger')

const GROUPSTORE_DIR = path.join(__dirname, '..', 'groupstore')
const COUNTER_DIR = path.join(GROUPSTORE_DIR, 'messagecount')

// Global pending kicks map
const pendingKicks = new Map()

const ensureDir = () => {
  if (!fs.existsSync(COUNTER_DIR)) {
    fs.mkdirSync(COUNTER_DIR, { recursive: true })
  }
}

const getCounterFile = (groupId) => {
  ensureDir()
  return path.join(COUNTER_DIR, `${groupId}.json`)
}

const getSettingsFile = (groupId) => {
  ensureDir()
  return path.join(COUNTER_DIR, `${groupId}_settings.json`)
}

// ── Clean number (remove + and any non-numeric) ─────────────
const cleanNum = (num) => {
  if (!num) return ''
  return String(num).replace(/[^0-9]/g, '')
}

// ── Normalize JID for consistent Map keys (remove device suffix) ─
const normalizeJid = (jid) => {
  if (!jid) return ''
  return String(jid).replace(/:[0-9]+/, '').toLowerCase()
}

// ── Ensure proper JID format ────────────────────────────────
const ensureProperJid = (jid) => {
  if (!jid) return null
  // If already ends with @s.whatsapp.net, return as-is
  if (jid.endsWith('@s.whatsapp.net')) return jid
  // If ends with @lid, we can't use it for mentions - return null to indicate invalid
  if (jid.endsWith('@lid')) return null
  // If has @, extract the part before it
  if (jid.includes('@')) {
    const num = jid.split('@')[0].replace(/:/g, '')
    return `${num}@s.whatsapp.net`
  }
  // Assume it's just a number
  return `${jid}@s.whatsapp.net`
}

// ── Check if counter is active ──────────────────────────────
const isActive = (groupId) => {
  try {
    const file = getSettingsFile(groupId)
    if (!fs.existsSync(file)) return false
    const settings = JSON.parse(fs.readFileSync(file, 'utf8'))
    return settings.active === true
  } catch {
    return false
  }
}

// ── Set active state ────────────────────────────────────────
const setActive = (groupId, active) => {
  try {
    const file = getSettingsFile(groupId)
    if (!active) {
      const counterFile = getCounterFile(groupId)
      if (fs.existsSync(counterFile)) fs.unlinkSync(counterFile)
      if (fs.existsSync(file)) fs.unlinkSync(file)
      logger.info(`Active counter cleared for ${groupId}`)
      return true
    }
    
    fs.writeFileSync(file, JSON.stringify({ active: true, startedAt: Date.now() }, null, 2))
    logger.info(`Active counter enabled for ${groupId}`)
    return true
  } catch (err) {
    logger.error(`Active counter setActive error: ${err.message}`)
    return false
  }
}

// ── Increment message count for user ────────────────────────
const incrementCount = (groupId, userJid) => {
  if (!isActive(groupId)) return false
  
  try {
    // Ensure we have a proper JID (not LID)
    const properJid = ensureProperJid(userJid)
    if (!properJid) {
      logger.debug(`Skipping count for invalid JID: ${userJid}`)
      return false
    }
    
    const file = getCounterFile(groupId)
    const userNum = cleanNum(jidToNum(properJid))
    if (!userNum) return false
    
    let data = {}
    if (fs.existsSync(file)) {
      data = JSON.parse(fs.readFileSync(file, 'utf8'))
    }
    
    if (!data[userNum]) {
      data[userNum] = { 
        count: 0, 
        firstSeen: Date.now(),
        jid: properJid // Store the proper JID for mentioning
      }
    }
    
    data[userNum].count++
    data[userNum].lastActive = Date.now()
    // Ensure JID is always updated to the latest proper format
    data[userNum].jid = properJid
    
    fs.writeFileSync(file, JSON.stringify(data, null, 2))
    return true
  } catch (err) {
    logger.error(`Active counter increment error: ${err.message}`)
    return false
  }
}

// ── Get all counter data ────────────────────────────────────
const getData = (groupId) => {
  try {
    const file = getCounterFile(groupId)
    if (!fs.existsSync(file)) return {}
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return {}
  }
}

// ── Get sorted active users ─────────────────────────────────
const getSortedActive = (groupId) => {
  const data = getData(groupId)
  return Object.entries(data)
    .map(([num, info]) => ({ 
      num: cleanNum(num), 
      jid: info.jid || `${cleanNum(num)}@s.whatsapp.net`,
      count: info.count || 0,
      ...info 
    }))
    .sort((a, b) => b.count - a.count)
}

// ── Get inactive users (filtered to exclude active) ─────────
const getInactiveUsers = async (sock, groupId) => {
  try {
    const data = getData(groupId)
    const activeNums = new Set(Object.keys(data).map(cleanNum))
    
    const meta = await sock.groupMetadata(groupId)
    const botNum = cleanNum(jidToNum(sock.user.id))
    
    // Filter: not in active list, not bot, and has valid JID
    return meta.participants
      .filter(p => {
        const pNum = cleanNum(jidToNum(p.id))
        return !activeNums.has(pNum) && pNum !== botNum
      })
      .map(p => ({ 
        num: cleanNum(jidToNum(p.id)), 
        jid: p.id, // Use actual JID from group metadata
        inactive: true 
      }))
  } catch (err) {
    logger.error(`getInactiveUsers error: ${err.message}`)
    return []
  }
}

// ── Get all participants ranked (active first, then inactive) ─
const getAllParticipantsRanked = async (sock, groupId) => {
  try {
    const data = getData(groupId)
    const meta = await sock.groupMetadata(groupId)
    const botNum = cleanNum(jidToNum(sock.user.id))
    
    // Active users from database
    const activeList = getSortedActive(groupId)
    const activeNums = new Set(activeList.map(u => u.num))
    
    // Inactive users from group metadata (excluding active ones)
    const inactiveList = meta.participants
      .filter(p => {
        const pNum = cleanNum(jidToNum(p.id))
        return !activeNums.has(pNum) && pNum !== botNum
      })
      .map(p => ({ 
        num: cleanNum(jidToNum(p.id)), 
        jid: p.id,
        count: 0, 
        inactive: true 
      }))
      .sort(() => Math.random() - 0.5)
    
    return [...activeList, ...inactiveList]
  } catch (err) {
    logger.error(`getAllParticipantsRanked error: ${err.message}`)
    return []
  }
}

// ── Get top N active users ──────────────────────────────────
const getTopActive = (groupId, n = 5) => {
  return getSortedActive(groupId).slice(0, n)
}

// ── Pause and clear when demoted ────────────────────────────
const pauseAndClear = (groupId) => {
  try {
    const settingsFile = getSettingsFile(groupId)
    if (fs.existsSync(settingsFile)) {
      const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'))
      settings.active = false
      settings.paused = true
      settings.pausedAt = Date.now()
      fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2))
    }
    logger.info(`Active counter paused for ${groupId}`)
    return true
  } catch (err) {
    logger.error(`pauseAndClear error: ${err.message}`)
    return false
  }
}

// ── Check if paused ─────────────────────────────────────────
const isPaused = (groupId) => {
  try {
    const file = getSettingsFile(groupId)
    if (!fs.existsSync(file)) return false
    const settings = JSON.parse(fs.readFileSync(file, 'utf8'))
    return settings.paused === true
  } catch {
    return false
  }
}

// ── Pending kick operations ─────────────────────────────────
const setPendingKick = (groupId, data) => pendingKicks.set(groupId, data)
const getPendingKick = (groupId) => pendingKicks.get(groupId)
const removePendingKick = (groupId) => pendingKicks.delete(groupId)
const hasPendingKick = (groupId) => pendingKicks.has(groupId)

module.exports = {
  isActive,
  setActive,
  incrementCount,
  getData,
  getSortedActive,
  getInactiveUsers,
  getAllParticipantsRanked,
  getTopActive,
  pauseAndClear,
  isPaused,
  setPendingKick,
  getPendingKick,
  removePendingKick,
  hasPendingKick,
  cleanNum,
  normalizeJid, // ← ADDED: Export for use in kick/cancel commands
}
