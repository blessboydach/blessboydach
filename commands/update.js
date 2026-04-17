// ============================================================
//  VANGUARD MD — commands/update.js
//  Smart update: Check → Count → Restart only if needed
// ============================================================

const https = require('https')

// Config (same as ghost loader)
const R_OWNER = 'ojoco'
const R_NAME = 'ojoco'
const R_BRANCH = 'main'

module.exports = async (ctx) => {
  const { sock, msg, jid, reply, isSudo } = ctx

  if (!isSudo) return reply('❌ Command Reserved For Owner And Sudos only!')

  // Step 1: Check GitHub
  const checkMsg = await sock.sendMessage(jid, {
    text: '⏳ Checking for updates...',
  }, { quoted: msg })

  try {
    // Fetch current GitHub tree
    const treeUrl = `https://api.github.com/repos/${R_OWNER}/${R_NAME}/git/trees/${R_BRANCH}?recursive=1`
    const treeData = await fetchJSON(treeUrl)
    const remoteFiles = treeData.tree.filter(i => i.type === 'blob')
    
    // Get local VFS (what's currently running)
    const VFS = global.VFS_INSTANCE
    let updateCount = 0
    
    // Compare each file
    for (const file of remoteFiles) {
      // Skip preserved files (they don't update via VFS)
      if (isPreserved(file.path)) continue
      
      const absPath = require('path').join('/home/container', file.path)
      
      // Check if file exists in VFS and compare SHA/content
      if (VFS.has(absPath)) {
        // Simple check: if size differs or we don't have it cached, mark as update
        // GitHub tree gives us SHA, we could compare but size check is faster
        const localContent = VFS.get(absPath).content
        const localSize = Buffer.isBuffer(localContent) ? localContent.length : Buffer.byteLength(localContent)
        
        // If sizes differ significantly, it's an update
        // (This is a heuristic - for 100% accuracy we'd need to fetch and hash compare)
        if (localSize !== file.size) {
          updateCount++
        }
      } else {
        // File not in VFS = new file
        updateCount++
      }
    }

    // Step 2: Report result
    if (updateCount === 0) {
      // No updates - edit message and stop
      await sock.sendMessage(jid, {
        text: 'Your system is up to date ✅',
        edit: checkMsg.key
      })
      return // DON'T EXIT
    }

    // Updates found - show count
    await sock.sendMessage(jid, {
      text: `Found ${updateCount} updates ✅`,
      edit: checkMsg.key
    })

    // Step 3: Restart sequence
    await new Promise(r => setTimeout(r, 800))
    await reply('🔁 System Update Started ✅')
    
    // Small delay then exit (panel restarts automatically)
    setTimeout(() => process.exit(1), 2000)

  } catch (err) {
    await sock.sendMessage(jid, {
      text: `❌ Check failed: ${err.message}`,
      edit: checkMsg.key
    })
  }
}

// Helper: fetch JSON from GitHub
const fetchJSON = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'VanguardBot/2.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) 
        return resolve(fetchJSON(res.headers.location))
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`))
      let data = ''
      res.setEncoding('utf8')
      res.on('data', c => data += c)
      res.on('end', () => {
        try { resolve(JSON.parse(data)) } 
        catch (e) { reject(new Error('Invalid JSON')) }
      })
    }).on('error', reject).setTimeout(10000, () => reject(new Error('Timeout')))
  })
}

// Helper: check if path is preserved (same as ghost loader)
const isPreserved = (relPath) => {
  const DISK_PRESERVE = [
    'data', 'groupstore', 'session', 'src', 
    'temp', 'tmp', '.npm', '.git', 'node_modules', 'assets'
  ]
  const FILE_PRESERVE = ['config.js', 'defaults.js', 'creds.json']
  
  if (!relPath) return false
  const parts = relPath.split('/')
  if (parts.length === 1 && FILE_PRESERVE.includes(parts[0])) return true
  return parts.some(p => DISK_PRESERVE.includes(p))
}
