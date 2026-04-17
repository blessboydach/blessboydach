// ════════════════════════════════════════════════════════════
//  VANGUARD MD — lib/anticallhelper.js
//  COPY-PASTED FROM menu.js logic — EXACT SAME PATTERN
// ════════════════════════════════════════════════════════════

const fs   = require('fs')
const path = require('path')

const DATA_DIR = path.join(__dirname, '..', 'data')
const CONFIG_FILE = path.join(DATA_DIR, 'config.json')

const ensureDir = () => {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

const safeJid = (p) => {
  if (!p) return ''
  if (typeof p === 'string') return p
  return p.id || p.jid || String(p)
}

const jidToNum = (jid) => {
  if (!jid) return ''
  const str = safeJid(jid)
  return str.split('@')[0].replace(/[^0-9]/g, '')
}

const DEFAULT_CONFIG = {
  anticall: {
    enabled: false,
    mode: 'off',
    message: '❌ *Sorry, I don\'t accept calls.*\n_Please send a message instead._',
    customMessageTemplate: 'Hey 👋🏾 {caller}, {me} is away on some serious option. Your {calltype} call has been declined.',
    useCustomMessage: false,
    notifyOwner: true,
    blockReason: 'Auto-blocked by anti-call system'
  }
}

const readConfig = () => {
  try {
    ensureDir()
    if (!fs.existsSync(CONFIG_FILE)) {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2))
      return DEFAULT_CONFIG
    }
    const data = fs.readFileSync(CONFIG_FILE, 'utf8')
    const parsed = JSON.parse(data)
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      anticall: { ...DEFAULT_CONFIG.anticall, ...(parsed.anticall || {}) }
    }
  } catch (err) {
    console.error('[anticallhelper] Error reading config:', err.message)
    return DEFAULT_CONFIG
  }
}

const writeConfig = (config) => {
  try {
    ensureDir()
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
    return true
  } catch (err) {
    console.error('[anticallhelper] Error writing config:', err.message)
    return false
  }
}

const getAntiCallConfig = () => {
  const config = readConfig()
  return config.anticall || DEFAULT_CONFIG.anticall
}

const saveAntiCallConfig = (anticallConfig) => {
  const config = readConfig()
  config.anticall = { ...config.anticall, ...anticallConfig }
  return writeConfig(config)
}

const setMode = (mode) => {
  const validModes = ['msg', 'decline', 'block', 'off']
  if (!validModes.includes(mode)) return false
  const config = getAntiCallConfig()
  config.mode = mode
  config.enabled = mode !== 'off'
  return saveAntiCallConfig(config)
}

const getMode = () => {
  const config = getAntiCallConfig()
  return config.mode || 'msg'
}

const isEnabled = () => {
  const config = getAntiCallConfig()
  return config.enabled && config.mode !== 'off'
}

const setCustomMessage = (template) => {
  const config = getAntiCallConfig()
  config.customMessageTemplate = template
  config.useCustomMessage = true
  return saveAntiCallConfig(config)
}

const resetMessage = () => {
  const config = getAntiCallConfig()
  config.message = DEFAULT_CONFIG.anticall.message
  config.customMessageTemplate = DEFAULT_CONFIG.anticall.customMessageTemplate
  config.useCustomMessage = false
  return saveAntiCallConfig(config)
}

const getMessage = () => {
  const config = getAntiCallConfig()
  return config.useCustomMessage ? config.customMessageTemplate : config.message
}

const formatMessage = (template, variables) => {
  let formatted = template
  for (const [key, value] of Object.entries(variables)) {
    formatted = formatted.replace(new RegExp(`{${key}}`, 'gi'), value)
  }
  return formatted
}

// ════════════════════════════════════════════════════════════
//  EXACT COPY OF menu.js PATTERN — NO CHANGES, NO THINKING
// ════════════════════════════════════════════════════════════

const handleCall = async (sock, call, ownerJid) => {
  const config = getAntiCallConfig()
  const { id: callId, from: callerJid, status } = call
  
  if (status !== 'offer') return { action: 'ignored' }
  if (!config.enabled || config.mode === 'off') return { action: 'ignored' }
  
  const callType = call.isVideo ? 'video' : 'voice'
  const meName = sock.user?.name || 'VANGUARD MD'
  const callerNum = jidToNum(callerJid) // Just the number, no @
  
  try {
    // Reject call
    await sock.rejectCall(callId, callerJid)
    
    if (config.mode === 'decline') {
      return { action: 'declined', caller: callerJid }
    }
    
    if (config.mode === 'block') {
      try {
        await sock.updateBlockStatus(callerJid, 'block')
        
        // Message to caller — NO MENTION (they know who they are)
        await sock.sendMessage(callerJid, {
          text: `🚫 *CALL BLOCKED*\n\nYour ${callType} call was declined and you've been blocked.\n_Contact owner if this is a mistake._`
        })
        
        // Message to owner — EXACT menu.js pattern: @number in text, JID in mentions
        if (config.notifyOwner && ownerJid) {
          const mentions = [callerJid] // ← EXACTLY like menu.js
          await sock.sendMessage(ownerJid, {
            text: `🚫 *Anti-Call Block*\n\nBlocked: @${callerNum}\nType: ${callType} call\nTime: ${new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })}`,
            mentions // ← EXACTLY like menu.js
          })
        }
        return { action: 'blocked', caller: callerJid }
      } catch (err) {
        console.error('Block failed:', err.message)
      }
    }
    
    // MSG MODE — EXACT menu.js pattern
    let messageText
    if (config.useCustomMessage && config.customMessageTemplate) {
      // @number in text, caller JID in mentions
      messageText = formatMessage(config.customMessageTemplate, {
        caller: `@${callerNum}`, // ← @NUMBER
        me: meName,
        calltype: callType,
        time: new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi', hour12: true })
      })
    } else {
      messageText = config.message
    }
    
    // EXACT menu.js send pattern
    const mentions = [callerJid] // ← JID ARRAY like menu.js
    
    await sock.sendMessage(callerJid, {
      text: messageText,
      mentions // ← HAS MENTIONS ARRAY like menu.js
    })
    
    return { action: 'declined_with_msg', caller: callerJid }
    
  } catch (err) {
    console.error('[anticallhelper] Handle call error:', err.message)
    return { action: 'error', error: err.message }
  }
}

const getStatus = () => {
  const config = getAntiCallConfig()
  return {
    enabled: config.enabled,
    mode: config.mode,
    useCustomMessage: config.useCustomMessage,
    currentMessage: getMessage(),
    notifyOwner: config.notifyOwner
  }
}

module.exports = {
  getAntiCallConfig,
  saveAntiCallConfig,
  setMode,
  getMode,
  isEnabled,
  setCustomMessage,
  resetMessage,
  getMessage,
  formatMessage,
  handleCall,
  getStatus,
  DEFAULT_CONFIG,
  VALID_MODES: ['msg', 'decline', 'block', 'off']
}
