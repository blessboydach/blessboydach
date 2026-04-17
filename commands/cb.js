// ============================================================
//  VANGUARD MD — commands/cb.js
//  Personal text storage & quick copy helper (short alias)
//  Mirror of clipboard.js — uses exact same mechanisms & storage
// ============================================================

const fs   = require('fs')
const path = require('path')

const CLIPBOARD_DIR = path.join(__dirname, '..', 'data', 'clipboard')
const PIN_FILE      = path.join(CLIPBOARD_DIR, 'pin.json')

// Ensure directory exists
if (!fs.existsSync(CLIPBOARD_DIR)) {
  fs.mkdirSync(CLIPBOARD_DIR, { recursive: true })
}

// Get next available number
const getNextId = () => {
  try {
    const files = fs.readdirSync(CLIPBOARD_DIR)
      .filter(f => f.endsWith('.json') && !f.includes('pin'))
      .map(f => parseInt(f.replace('.json', '')))
      .filter(n => !isNaN(n))
    return files.length > 0 ? Math.max(...files) + 1 : 1
  } catch {
    return 1
  }
}

// Get all clips sorted
const getAllClips = () => {
  try {
    return fs.readdirSync(CLIPBOARD_DIR)
      .filter(f => f.endsWith('.json') && !f.includes('pin'))
      .map(f => {
        const num = parseInt(f.replace('.json', ''))
        const content = JSON.parse(fs.readFileSync(path.join(CLIPBOARD_DIR, f), 'utf8'))
        return { num, content: content.text || content }
      })
      .sort((a, b) => a.num - b.num)
  } catch {
    return []
  }
}

module.exports = async (ctx) => {
  const { sock, msg, jid, reply, args, isOwner, isSudo } = ctx

  // Permission check
  if (!isOwner && !isSudo) {
    return reply('❌ This command is reserved for Owner and Sudo users only.')
  }

  const action = args[0]?.toLowerCase()

  // No args = Help
  if (!action) {
    return reply(
      '*📋 CB Commands (Clipboard Alias)*\n' +
      '`cb add <text>` - Save text (auto-numbered)\n' +
      '`cb del <num>` - Delete specific clip\n' +
      '`cb view <num>` - Show clip content (copy-friendly)\n' +
      '`cb list` - Show all clips (first 15 chars)\n' +
      '`cb pin <num>` - Pin a clip for quick access\n' +
      '`cb pv` - View pinned clip\n' +
      '`cb clear` - Delete all clips\n' +
      '_Example: `cb add Meeting at 5pm`_'
    )
  }

  // ADD
  if (action === 'add') {
    const text = args.slice(1).join(' ')
    if (!text) return reply('❌ Provide text to save.\nExample: `cb add Hello World`')

    const id = getNextId()
    const filePath = path.join(CLIPBOARD_DIR, `${id}.json`)
    
    fs.writeFileSync(filePath, JSON.stringify({ text, savedAt: new Date().toISOString() }))
    
    return reply(`✅ Added: Successfully \nCode Number is ${id}`)
  }

  // DELETE
  if (action === 'del' || action === 'delete') {
    const num = parseInt(args[1])
    if (!num || isNaN(num)) return reply('❌ Provide a valid number.\nExample: `cb del 3`')

    const filePath = path.join(CLIPBOARD_DIR, `${num}.json`)
    
    if (!fs.existsSync(filePath)) {
      return reply(`❌ No clip found with number ${num}`)
    }

    fs.unlinkSync(filePath)
    return reply(`✅ Deleted clip ${num}`)
  }

  // VIEW
  if (action === 'view' || action === 'show') {
    const num = parseInt(args[1])
    if (!num || isNaN(num)) return reply('❌ Provide a valid number.\nExample: `cb view 3`')

    const filePath = path.join(CLIPBOARD_DIR, `${num}.json`)
    
    if (!fs.existsSync(filePath)) {
      return reply(`❌ No clip found with number ${num}`)
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    
    // Send raw text first (easy to copy)
    await reply(data.text || data)
    // Then confirm delivery
    return reply('✅ Delivered')
  }

  // LIST
  if (action === 'list' || action === 'ls') {
    const clips = getAllClips()
    
    if (clips.length === 0) {
      return reply('📋 Clipboard is empty.\nAdd something with `cb add <text>`')
    }

    // Build list with first 15 chars
    let lines = clips.map(c => {
      const preview = c.content.length > 15 ? c.content.substring(0, 15) + '...' : c.content
      return `${c.num}. ${preview}`
    })

    // Split if too long (WhatsApp limit ~4096, we use 3500 to be safe)
    const fullText = lines.join('\n')
    
    if (fullText.length > 3500) {
      const chunks = []
      let current = ''
      
      for (const line of lines) {
        if ((current + line + '\n').length > 3500) {
          chunks.push(current)
          current = line + '\n'
        } else {
          current += line + '\n'
        }
      }
      if (current) chunks.push(current)

      for (let i = 0; i < chunks.length; i++) {
        await reply(`📋 Clipboard (${i + 1}/${chunks.length}):\n${chunks[i]}`)
      }
      return
    }

    return reply(`📋 Saved Clips:\n${fullText}\n_View with: cb view <number>_`)
  }

  // PIN
  if (action === 'pin') {
    const num = parseInt(args[1])
    if (!num || isNaN(num)) return reply('❌ Provide a valid number to pin.\nExample: `cb pin 3`')

    const filePath = path.join(CLIPBOARD_DIR, `${num}.json`)
    if (!fs.existsSync(filePath)) {
      return reply(`❌ No clip found with number ${num}`)
    }

    fs.writeFileSync(PIN_FILE, JSON.stringify({ pinned: num }))
    return reply(`📌 Pinned clip ${num}. Use \`cb pv\` to view it anytime.`)
  }

  // PIN VIEW (pv)
  if (action === 'pv' || action === 'pinview') {
    if (!fs.existsSync(PIN_FILE)) {
      return reply('❌ No clip pinned yet.\nPin one with `cb pin <num>`')
    }

    const pinData = JSON.parse(fs.readFileSync(PIN_FILE, 'utf8'))
    const filePath = path.join(CLIPBOARD_DIR, `${pinData.pinned}.json`)

    if (!fs.existsSync(filePath)) {
      return reply(`❌ Pinned clip ${pinData.pinned} no longer exists.`)
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    await reply(data.text || data)
    return reply('✅ Delivered')
  }

  // CLEAR
  if (action === 'clear' || action === 'clr') {
    try {
      const files = fs.readdirSync(CLIPBOARD_DIR)
        .filter(f => f.endsWith('.json'))
      
      if (files.length === 0) {
        return reply('📋 Clipboard is already empty.')
      }

      for (const f of files) {
        fs.unlinkSync(path.join(CLIPBOARD_DIR, f))
      }
      
      return reply('🗑️ Clipboard cleared. All clips deleted.')
    } catch (err) {
      return reply('❌ Error clearing clipboard: ' + err.message)
    }
  }

  // Unknown action
  return reply('❌ Unknown action. Use `cb` alone to see available commands.')
}