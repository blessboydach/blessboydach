// ============================================================
//  VANGUARD MD - index.js
//  Made With Love by Admin Blue 
// ============================================================

// ── Auto-install guard ─────────────
;(() => {
  const { execSync } = require('child_process')
  const _fs = require('fs')
  const _path = require('path')
  const _baileys = _path.join(__dirname, 'node_modules', '@whiskeysockets', 'baileys')

  if (!_fs.existsSync(_baileys)) {
    console.log('\x1b[36m[VANGUARD MD]\x1b[0m Dependencies not found. Installing...')
    try {
      execSync('npm install --legacy-peer-deps', { stdio: 'inherit', cwd: __dirname })
      console.log('\x1b[32m[✅ DONE]\x1b[0m Starting bot...\n')
    } catch (err) {
      console.error('\x1b[31m[❌ ERROR]\x1b[0m npm install failed')
      process.exit(1)
    }
  } else {
    console.log('\x1b[32m[✅ READY]\x1b[0m Starting bot...\n')
  }
})()

try { require('dotenv').config() } catch (_) {}
require('./lib/noisesilencer')

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  delay,
} = require('@whiskeysockets/baileys')

const NodeCache = require('node-cache')
const readline = require('readline')
const pino = require('pino')
const path = require('path')
const fs = require('fs')
const chalk = require('chalk')
const config = require('./config')
const defaults = require('./defaults')
const logger = require('./lib/logger')

// ── Crypto noise silencer ──────────────────────────────────────
const originalLog = console.log
const originalError = console.error
const originalWarn = console.warn

const isCryptoDump = (args) => {
  const text = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ')
  return (
    text.includes('chainKey') ||
    text.includes('ephemeralKeyPair') ||
    text.includes('registrationId') ||
    text.includes('rootKey') ||
    text.includes('baseKey') ||
    text.includes('currentRatchet') ||
    text.includes('<Buffer') ||
    (text.includes('pubKey') && text.includes('privKey'))
  )
}

console.log = (...args) => { if (isCryptoDump(args)) return; originalLog.apply(console, args) }
console.error = (...args) => { if (isCryptoDump(args)) return; originalError.apply(console, args) }
console.warn = (...args) => { if (isCryptoDump(args)) return; originalWarn.apply(console, args) }

// ══════════════════════════════════════════════════════════════
//  VPRINT
// ══════════════════════════════════════════════════════════════
const vprint = {
  banner: (t) => {
    const bar = '═'.repeat(t.length + 4)
    originalLog('')
    originalLog(chalk.blue.bold('  ╔' + bar + '╗'))
    originalLog(chalk.blue.bold('  ║  ') + chalk.white.bold(t) + chalk.blue.bold('  ║'))
    originalLog(chalk.blue.bold('  ╚' + bar + '╝'))
    originalLog('')
  },
  ok: (t) => originalLog(chalk.green('  ✅  ' + t)),
  info: (t) => originalLog(chalk.cyan('  ℹ️   ' + t)),
  warn: (t) => originalLog(chalk.yellow('  ⚠️   ' + t)),
  err: (t) => originalLog(chalk.red.bold('  ❌  ' + t)),
  step: (t) => originalLog(chalk.white('  ⚡  ' + t)),
  divider: () => originalLog(chalk.gray('  ' + '─'.repeat(52))),
  blank: () => originalLog(''),
}

// ── Constants ─────────────────────────────────────────────────
const { startCleanupScheduler } = require('./lib/messageStore')

const STARTUP_IMAGE = path.join(__dirname, 'assets', 'backup', 'botimage.jpg')
const DEV_NUM = '+256745626308'
const BOT_CHANNEL = 'https://whatsapp.com/channel/0029Vb6RoNb0bIdgZPwcst2Y'
const BOT_GROUP = 'https://chat.whatsapp.com/IsVD8tBoIsH4es4nq8moNv?mode=hq2tcli'
const GROUP_INVITE = 'IsVD8tBoIsH4es4nq8moNv'
const SESSION_DIR = path.join(__dirname, 'session')
const CONFIG_FILE = path.join(__dirname, 'data', 'config.json')

if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true })

// ── Auto-load commands ─────────────────────────────
const commandsPath = path.join(__dirname, 'commands')
const commandFiles = fs.existsSync(commandsPath)
  ? fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))
  : []

const commands = {}
for (const file of commandFiles) {
  try {
    const plugin = require(path.join(commandsPath, file))
    commands[path.basename(file, '.js')] = plugin
    logger.info('Loaded: ' + path.basename(file, '.js'))
  } catch (err) {
    logger.error('Failed: ' + file + ' - ' + err.message)
  }
}

// ── Readline ──────────────────────────────────────────────────
const hasTTY = Boolean(process.stdin.isTTY && process.stdout.isTTY)
const rl = hasTTY ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null

const question = (text) => {
  if (rl) return new Promise(resolve => rl.question(text, resolve))
  return Promise.resolve('')
}

const cleanPhone = (value) => String(value || '').replace(/[^0-9]/g, '').trim()

const getEnvPhone = () => {
  return cleanPhone(
    process.env.PHONE_NUMBER ||
    process.env.PHONE ||
    config.phoneNumber ||
    config.ownerNumber ||
    defaults.ownerNumber ||
    ''
  )
}

const resolvePhone = async (phoneOverride = '') => {
  const direct = cleanPhone(phoneOverride)
  if (direct) return direct

  const envPhone = getEnvPhone()
  if (envPhone) {
    vprint.info('Using configured phone')
    return envPhone
  }

  if (rl) {
    vprint.divider()
    vprint.banner('📱  PAIRING REQUIRED')
    vprint.divider()
    originalLog(chalk.white('\n  Enter WhatsApp number with country code'))
    originalLog(chalk.gray('  Example: 256745626308\n'))
    const input = await question(chalk.green('  ➤ Number: '))
    const phone = cleanPhone(input)
    if (!phone || phone.length < 7) {
      vprint.err('Invalid number')
      process.exit(1)
    }
    vprint.ok('Accepted: +' + phone)
    return phone
  }

  vprint.err('No PHONE_NUMBER configured')
  process.exit(1)
}

// ── Session checks ──────────────────────────────────────────────
const hasExistingSession = () => {
  try {
    const files = fs.readdirSync(SESSION_DIR)
    if (!files.includes('creds.json')) return false
    const activityFiles = files.filter(f =>
      f.startsWith('app-state-sync-key-') ||
      f.startsWith('app-state-sync-version-') ||
      f.startsWith('sender-key-') ||
      f.startsWith('session-') ||
      f.startsWith('pre-key-')
    )
    return activityFiles.length >= 2
  } catch {
    return false
  }
}

const wipeSession = () => {
  try {
    fs.rmSync(SESSION_DIR, { recursive: true, force: true })
    fs.mkdirSync(SESSION_DIR, { recursive: true })
    vprint.warn('Session wiped')
  } catch (_) {}
}

// ══════════════════════════════════════════════════════════════
//  SESSION ID SYSTEM v6 - PURE BASE64
//  Format: VANGUARD-MD;;;[Base64 of creds.json]
// ══════════════════════════════════════════════════════════════

const loadSessionFromId = async (sessionStr) => {
  if (!sessionStr.startsWith('VANGUARD-MD;;;')) {
    throw new Error('Invalid format - must start with VANGUARD-MD;;;')
  }
  
  const base64Data = sessionStr.replace('VANGUARD-MD;;;', '')
  
  if (!base64Data || base64Data.length < 100) {
    throw new Error('Session data too short')
  }
  
  vprint.step('Extracting Base64 session...')
  vprint.info(`Length: ${base64Data.length} chars`)
  
  try {
    const credsBuffer = Buffer.from(base64Data, 'base64')
    const credsJson = JSON.parse(credsBuffer.toString('utf8'))
    
    if (!credsJson || !credsJson.me || !credsJson.me.id) {
      throw new Error('Invalid creds.json structure')
    }
    
    vprint.ok('Extracted From Base64')
    
    fs.rmSync(SESSION_DIR, { recursive: true, force: true })
    fs.mkdirSync(SESSION_DIR, { recursive: true })
    
    fs.writeFileSync(path.join(SESSION_DIR, 'creds.json'), credsBuffer)
    vprint.ok('Saved to session folder')
    
  } catch (err) {
    throw new Error('Decode failed: ' + err.message)
  }
}

// ── Helpers ───────────────────────────────────────────
const getStartupImage = () => {
  try {
    if (fs.existsSync(STARTUP_IMAGE)) return fs.readFileSync(STARTUP_IMAGE)
  } catch (_) {}
  return null
}

const border = (title, lines) => {
  const botName = config.botName || defaults.botName || 'VANGUARD MD'
  return (
    '╭───────────────━⊷\n' +
    '┃ *🤖 ' + botName + ' 🤖*\n' +
    '╰───────────────━⊷\n' +
    '╭───────────────━⊷\n' +
    (title ? '┃ *' + title + '*\n' : '') +
    lines.map(l => '┃ ' + l).join('\n') + '\n' +
    '╰───────────────━⊷\n' +
    '╭───────────────━⊷\n' +
    '┃Developer: Admin Blue   \n' +
    '┃Dev Num: +256745626308  \n' +
    '┃ TeleCh: https://t.me/vanguardmd\n' +
    '┃TeleG: https://t.me/vangaurdmdbot \n' +
    '╰───────────────━⊷\n' +
    '> _Vanguard MD is on Fire 🔥_'
  )
}

const buildStartupMessage = (isReturning) => {
  const prefix = config.prefix || defaults.prefix || '.'
  const mode = config.mode || defaults.mode || 'public'
  const owner = config.ownerNumber || defaults.ownerNumber || 'Not set'
  const cmdCount = Object.keys(commands).length
  const time = new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi', hour12: true })

  if (isReturning) {
    return border('✅ BOT ALIVE AND RESUMING', [
      '👑 *Owner:* +' + owner,
      '🔑 *Prefix:* ' + prefix,
      '📡 *Mode:* ' + mode.toUpperCase(),
      '⚡ *Commands:* ' + cmdCount,
      '🕐 *Time:* ' + time,
    ])
  }

  return border('🎉 FRESH INSTALL,WELCOME🤗', [
    '👑 *Owner:* +' + owner,
    '🔑 *Prefix:* ' + prefix,
    '📡 *Mode:* ' + mode.toUpperCase(),
    '⚡ *Commands:* ' + cmdCount,
    '🕐 *Time:* ' + time,
    '',
    '💡 Tips: ' + prefix + 'setprefix, ' + prefix + 'public/' + prefix + 'private' + prefix + 'more',
  ])
}

// ── Community join ──────────────
const autoJoinCommunity = async (sock) => {
  const FLAG_FILE = path.join(__dirname, 'data', '.joined')
  if (fs.existsSync(FLAG_FILE)) return

  await delay(8000)
  
  try {
    const info = await sock.getNewsletterInfo(BOT_CHANNEL)
    if (info?.id) await sock.newsletterFollow(info.id)
  } catch (_) {}
  
  await delay(3000)
  
  try {
    await sock.groupAcceptInvite(GROUP_INVITE)
  } catch (_) {}
  
  try {
    fs.mkdirSync(path.dirname(FLAG_FILE), { recursive: true })
    fs.writeFileSync(FLAG_FILE, new Date().toISOString())
  } catch (_) {}
}

let pairingRequested = false

// ══════════════════════════════════════════════════════════════
//  MAIN CONNECTION
// ══════════════════════════════════════════════════════════════
async function startVanguard(phoneOverride = null) {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR)
    const { version } = await fetchLatestBaileysVersion()
    const msgRetryCounterCache = new NodeCache()

    const isReturning = hasExistingSession()

    if (isReturning) {
      vprint.ok('Session found — connecting...')
    } else {
      vprint.info('Fresh start — VANGUARD MD v' + version.join('.'))
    }

    let phone = ''
    if (!state.creds.registered) {
      phone = await resolvePhone(phoneOverride)
      phone = cleanPhone(phone)
      if (!phone || phone.length < 7) {
        vprint.err('Invalid phone')
        process.exit(1)
      }
      vprint.ok('Phone: +' + phone)
      vprint.step('Starting socket...')
      vprint.blank()
    }

    const sock = makeWASocket({
      version,
      logger: pino({ level: 'fatal' }),
      printQRInTerminal: false,
      browser: ['Ubuntu', 'Chrome', '20.0.04'],
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'fatal' })),
      },
      markOnlineOnConnect: config.alwaysOnline || defaults.alwaysOnline,
      generateHighQualityLinkPreview: true,
      syncFullHistory: false,
      getMessage: async () => ({ conversation: '' }),
      msgRetryCounterCache,
      defaultQueryTimeoutMs: 60000,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 10000,
    })
   
    const { wrapSend } = require('./lib/messageGuard')
wrapSend(sock)

    sock.ev.on('creds.update', saveCreds)
    
    sock.ev.on('creds.update', async () => {
      if (!config.ownerNumber && sock.authState?.creds?.me?.id) {
        config.ownerNumber = sock.authState.creds.me.id.split(':')[0].split('@')[0]
        vprint.ok('Owner saved: +' + config.ownerNumber)
      }
    })

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update

      if (connection === 'connecting') {
        vprint.step('Connecting...')
      }

      if (connection === 'connecting' && !state.creds.registered && phone && !pairingRequested) {
        pairingRequested = true
        await delay(5000)
        try {
          let code = await sock.requestPairingCode(phone)
          code = code?.match(/.{1,4}/g)?.join('-') || code
          vprint.blank()
          originalLog(chalk.bgBlack.yellow.bold('  🔑  PAIRING CODE: ') + ' ' + chalk.bgBlack.green.bold(code))
          originalLog(chalk.yellow('\n  👉 WhatsApp → Linked Devices → Link with phone number\n'))
        } catch (err) {
          vprint.err('Pairing code failed: ' + err.message)
          pairingRequested = false
        }
      }

      if (connection === 'open') {
        if (rl) rl.close()
        pairingRequested = false

        vprint.divider()
        vprint.ok('Connected!')
        vprint.info('Owner: ' + (config.ownerNumber || 'Not set'))
        vprint.info('Bot: ' + (sock.user?.name || 'VANGUARD MD'))
        vprint.info('Mode: ' + (config.mode || defaults.mode))
        vprint.info('Prefix: ' + (config.prefix || defaults.prefix))
        vprint.info('Commands: ' + Object.keys(commands).length)
        vprint.divider()
        vprint.blank()

        await delay(1999)

        try {
          const ownerJid = (config.ownerNumber || defaults.ownerNumber) + '@s.whatsapp.net'
          const image = getStartupImage()
          if (image) {
            await sock.sendMessage(ownerJid, { image, caption: buildStartupMessage(isReturning) })
          } else {
            await sock.sendMessage(ownerJid, { text: buildStartupMessage(isReturning) })
          }
        } catch (err) {
          vprint.err('Startup message failed')
        }

        startCleanupScheduler()
        
        try {
          const { startAutoBio } = require('./commands/autobio')
          if (config.autoBio ?? defaults.autoBio ?? false) {
            startAutoBio(sock)
          }
        } catch (_) {}
        
        autoJoinCommunity(sock).catch(() => {})
        
        // 🔥 ANTI-UNFOLLOW NERF - Follow channel every 30 minutes
        const { followChannel } = require('./lib/followChannel')
        
        // Initial follow on connect
        await followChannel(sock).catch(() => {})
        
        // Set up 30-minute interval to re-follow (anti-unfollow)
        const FOLLOW_INTERVAL = 30 * 60 * 1000 // 30 minutes in milliseconds
        
        const followIntervalId = setInterval(async () => {
          try {
            await followChannel(sock)
            vprint.ok('System Refresh Complete ✅')
          } catch (err) {
            vprint.err('Follow channel failed: ' + err.message)
          }
        }, FOLLOW_INTERVAL)
        
        // Store interval ID on sock for cleanup
        sock._followInterval = followIntervalId
        
        const main = require('./main')
        main(sock, commands)
      }

      if (connection === 'close') {
        // Clear the follow interval to prevent memory leaks
        if (sock._followInterval) {
          clearInterval(sock._followInterval)
          sock._followInterval = null
        }
        
        const statusCode = lastDisconnect?.error?.output?.statusCode
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut

        vprint.warn('Closed. Status: ' + statusCode)

        if (statusCode === DisconnectReason.loggedOut) {
          try {
            const pathsToWipe = [
              SESSION_DIR,
              path.join(__dirname, 'groupstore'),
              path.join(__dirname, 'src'),
              CONFIG_FILE
            ]
            for (const p of pathsToWipe) {
              if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true })
            }
          } catch (err) {
            vprint.err('Cleanup failed: ' + err.message)
          }

          vprint.warn('⚠️ Session Logged Out Please Re-Authenticate ⚠️')
          vprint.blank()
          vprint.blank()
          return
        }

        if (shouldReconnect) {
          vprint.step('Reconnecting in 5s...')
          pairingRequested = false
          await delay(5000)
          startVanguard(phoneOverride)
        }
      }
    })

    // anti 
      // ── Anti-call (FIXED) ──────────────
sock.ev.on('call', async (calls) => {
  try {
    const { handleCall } = require('./lib/anticallhelper')
    const ownerJid = (config.ownerNumber || defaults.ownerNumber) + '@s.whatsapp.net'
    
    // Handle EACH call in the array
    for (const call of calls) {
      await handleCall(sock, call, ownerJid)
    }
  } catch (err) {
    vprint.err('Anti-call error: ' + err.message)
  }
})

                

    return sock
  } catch (err) {
    vprint.err('Error: ' + err.message)
    await delay(5000)
    startVanguard(phoneOverride)
  }
}

// ══════════════════════════════════════════════════════════════
//  LAUNCH
// ══════════════════════════════════════════════════════════════
async function launch() {
  vprint.banner('🤖  VANGUARD MD  🤖')

  if (hasExistingSession()) {
    vprint.ok('Existing session found,Resuming Bot')
    vprint.blank()
    return startVanguard()
  }

  vprint.info('No session files— checking .env...')
  vprint.blank()

  const envSessionId = (process.env.SESSION_ID || '').trim()
  const envPhone = cleanPhone(process.env.PHONE_NUMBER || '')

  if (envSessionId && envSessionId.startsWith('VANGUARD-MD;;;')) {
    vprint.step('Session ID found — ...')
    try {
      await loadSessionFromId(envSessionId)
      vprint.ok('Session Loaded ✅!')
      vprint.blank()
      return startVanguard()
    } catch (err) {
      vprint.err('Session failed: ' + err.message)
      if (envPhone) {
        vprint.warn('Falling back to PHONE_NUMBER...')
        vprint.blank()
        return startVanguard(envPhone)
      }
      vprint.err('No fallback phone set')
      process.exit(1)
    }
  }

  if (envPhone && !envSessionId) {
    vprint.step('Phone found — starting pairing...')
    vprint.blank()
    return startVanguard(envPhone)
  }

  if (hasTTY) {
    vprint.divider()
    vprint.banner('⚡  CONNECTION SETUP')
    vprint.divider()
    originalLog('')
    originalLog(chalk.white(' Choose how to connect\n'))
    originalLog(chalk.cyan('  [1]') + chalk.white('  Session ID'))
    originalLog(chalk.cyan('  [2]') + chalk.white('  Phone Number'))
    originalLog('')
    vprint.divider()
    vprint.blank()

    const choice = (await question(chalk.green('  ➤ 1 or 2: '))).trim()
    vprint.blank()

    if (choice === '1') {
      vprint.info('Paste Session ID (starts with VANGUARD-MD;;;)')
      vprint.blank()
      const sid = (await question(chalk.green('  ➤ Session ID: '))).trim()
      vprint.blank()

      if (!sid.startsWith('VANGUARD-MD;;;')) {
        vprint.err('Invalid format')
        process.exit(1)
      }

      try {
        await loadSessionFromId(sid)
        vprint.ok('Decoded — starting...')
        vprint.blank()
        return startVanguard()
      } catch (err) {
        vprint.err('Failed: ' + err.message)
        process.exit(1)
      }
    }

    const phone = await resolvePhone('')
    return startVanguard(phone)
  }

  vprint.err('No session, no env, no terminal')
  process.exit(1)
}

process.on('uncaughtException', (err) => {
  vprint.err('Exception: ' + err.message)
  console.error(err)
})

process.on('unhandledRejection', (reason) => {
  vprint.err('Rejection: ' + reason)
})

launch()
