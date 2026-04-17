// ============================================================
//  VANGUARD MD — lib/hybridLogger.js (FIXED)
//  Now with breathing room and 100char sanity limit
// ============================================================

const chalk = require('chalk')

const timestamp = () => {
  return new Date().toLocaleString('en-KE', {
    timeZone: 'Africa/Nairobi',
    hour12: true,
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).replace(/,/g, '')
}

const fullMessageTime = () => {
  const now = new Date()
  const day = now.toLocaleString('en-US', { weekday: 'long', timeZone: 'Africa/Nairobi' })
  const time = now.toLocaleTimeString('en-KE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'Africa/Nairobi'
  })
  return `${day}, ${time} EAT`
}

// Type colors for different message types
const typeColors = {
  text: chalk.cyan,
  photo: chalk.magenta,
  video: chalk.red,
  audio: chalk.blue,
  sticker: chalk.green,
  document: chalk.yellow,
  contact: chalk.yellow,
  location: chalk.green,
  poll: chalk.gray,
  reaction: chalk.gray,
  command: chalk.hex('#FF00FF'),
  unknown: chalk.white
}

// Type emojis for visual identification
const typeEmojis = {
  text: '📝',
  photo: '📸',
  video: '🎥',
  audio: '🎵',
  sticker: '🎨',
  document: '📄',
  contact: '👤',
  location: '📍',
  poll: '📊',
  reaction: '👍',
  command: '⚡',
  unknown: '❓'
}

const printMessageBox = (data) => {
  const isCommand = data.isCommand || data.type === 'command'
  const displayType = isCommand ? 'command' : (data.type || 'unknown')
  const emoji = typeEmojis[displayType] || '💬'
  
  // Colors
  const leftColor = isCommand ? '#FF00FF' : '#00BFFF'
  const rightColor = isCommand ? '#00FFFF' : '#00FFAA'
  const typeColor = typeColors[displayType] || chalk.white
  
  // SPACING - Empty line before
  console.log('')
  
  // Top bar with emoji
  console.log(
    chalk.hex(leftColor)('>>'.repeat(8)) + 
    chalk.hex('#FFD700')(`『 ${emoji} VANGUARD MD 』`) + 
    chalk.hex(rightColor)('<<'.repeat(8))
  )

  // Content with spacing between lines
  console.log(chalk.yellow('>> Type:      ') + typeColor(displayType.toUpperCase()) + (isCommand ? chalk.hex('#FF00FF')(' ⚡') : ''))
  console.log(chalk.yellow('>> Time:      ') + chalk.white(fullMessageTime()))
  console.log(chalk.yellow('>> Sender:    ') + chalk.magenta(data.sender || 'unknown'))
  console.log(chalk.yellow('>> Name:      ') + chalk.yellow(data.name || 'Unknown'))
  console.log(chalk.yellow('>> Chat:      ') + chalk.blue(data.chatId?.includes('@g.us') ? 'Group' : 'DM'))
  
  // Message preview with 100char limit enforced
  let preview = data.message || 'N/A'
  if (preview.length > 100) {
    preview = preview.substring(0, 97) + '...'
  }
  console.log(chalk.yellow('>> Preview:   ') + chalk.greenBright(preview))

  // Bottom bar
  console.log(
    chalk.hex(rightColor)('<<'.repeat(8)) + 
    chalk.hex('#00FFAA')('『 VANGUARD MD 』') + 
    chalk.hex(leftColor)('>>'.repeat(8))
  )
  
  // SPACING - Empty line after for breathing room
  console.log('')
}

const hybridLogger = {
  info: (msg) => {
    console.log(chalk.cyan(`[${timestamp()}]`) + chalk.blue(' ℹ️  INFO ') + chalk.white(msg))
  },

  success: (msg) => {
    console.log(chalk.cyan(`[${timestamp()}]`) + chalk.green(' ✅ SUCCESS ') + chalk.greenBright(msg))
  },

  warn: (msg) => {
    console.log(chalk.cyan(`[${timestamp()}]`) + chalk.yellow(' ⚠️  WARN ') + chalk.yellowBright(msg))
  },

  error: (msg) => {
    console.log(chalk.cyan(`[${timestamp()}]`) + chalk.red(' ❌ ERROR ') + chalk.redBright(msg))
  },

  cmd: (msg) => {
    // Keep old format for compatibility but parse it
    const match = msg.match(/MSG \[(GROUP|DM)\] (\d+) -> (.+)/)
    if (match) {
      const [, chatType, sender, command] = match
      printMessageBox({
        type: 'command',
        sender: sender,
        name: 'User',
        chatId: chatType === 'GROUP' ? 'group@g.us' : sender + '@s.whatsapp.net',
        message: command,
        isCommand: true
      })
    } else {
      console.log(chalk.cyan(`[${timestamp()}]`) + chalk.magenta(' 📨 CMD ') + chalk.magentaBright(msg))
    }
  },

  debug: (msg) => {
    if (process.env.DEBUG === 'true') {
      console.log(chalk.cyan(`[${timestamp()}]`) + chalk.gray(' 🐛 DEBUG ') + chalk.gray(msg))
    }
  },

  group: (msg) => {
    console.log(chalk.cyan(`[${timestamp()}]`) + chalk.blueBright(' 👥 GROUP ') + chalk.white(msg))
  },

  // Main message logger - NOW WITH SPACING
  message: (data) => {
    printMessageBox(data)
  },

  divider: () => console.log(chalk.gray('━'.repeat(60))),

  banner: () => {
    console.log(chalk.greenBright(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ██╗   ██╗ █████╗ ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ ██████╗ ██████╗ 
   ██║   ██║██╔══██╗████╗  ██║██╔════╝ ██║   ██║██╔══██╗██╔══██╗██╔══██╗
   ██║   ██║███████║██╔██╗ ██║██║  ███╗██║   ██║███████║██████╔╝██║  ██║
   ╚██╗ ██╔╝██╔══██║██║╚██╗██║██║   ██║██║   ██║██╔══██║██╔══██╗██║  ██║
    ╚████╔╝ ██║  ██║██║ ╚████║╚██████╔╝╚██████╔╝██║  ██║██║  ██║██████╔╝
     ╚═══╝  ╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ 
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `))
  }
}

module.exports = hybridLogger
