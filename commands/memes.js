// ============================================================
//  VANGUARD MD — commands/memes.js
//  Random Memes from GitHub Repo (ojoco/memes)
//  No token needed • Avoids duplicates • Clean output
// ============================================================

const axios = require('axios')
const fs = require('fs')
const path = require('path')

const REPO_OWNER = 'ojoco'
const REPO_NAME = 'memes'
const MEMES_FOLDER = 'memes'
const TRACKING_FILE = path.join(__dirname, '../src/memes/memesdata.json')

// Ensure tracking folder & file exist
if (!fs.existsSync(path.dirname(TRACKING_FILE))) {
  fs.mkdirSync(path.dirname(TRACKING_FILE), { recursive: true })
}
if (!fs.existsSync(TRACKING_FILE)) {
  fs.writeFileSync(TRACKING_FILE, JSON.stringify([]))
}

module.exports = async (ctx) => {
  const { reply, sock, msg } = ctx

  await reply('⏳ Loading memes please wait ..')

  try {
    // Fetch list of memes from GitHub
    const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${MEMES_FOLDER}`
    const { data: files } = await axios.get(apiUrl, { timeout: 8000 })

    // Filter only image files
    const imageFiles = files.filter(f => 
      f.type === 'file' && 
      /\.(jpg|jpeg|png|gif|webp)$/i.test(f.name)
    )

    if (imageFiles.length === 0) {
      return reply('❌ No memes found.')
    }

    // Load already sent memes (global tracking)
    let sentMemes = []
    try {
      sentMemes = JSON.parse(fs.readFileSync(TRACKING_FILE, 'utf8'))
    } catch (_) {}

    // Get unseen memes
    let available = imageFiles.filter(f => !sentMemes.includes(f.name))

    // If almost all used → reset tracking
    if (available.length < 10) {
      sentMemes = []
      available = imageFiles
    }

    // Pick 10 random
    const selected = []
    const shuffled = [...available].sort(() => 0.5 - Math.random())

    for (let i = 0; i < 10 && i < shuffled.length; i++) {
      selected.push(shuffled[i])
    }

    // Send 10 plain images (no caption)
    for (const file of selected) {
      const imageUrl = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${MEMES_FOLDER}/${file.name}`
      
      await sock.sendMessage(msg.key.remoteJid, {
        image: { url: imageUrl }
      })
    }

    // Update tracking
    const newSent = selected.map(f => f.name)
    sentMemes = [...new Set([...sentMemes, ...newSent])]
    fs.writeFileSync(TRACKING_FILE, JSON.stringify(sentMemes, null, 2))

    // Final success message
    await reply('Memes Delivered Successfully ✅')

  } catch (err) {
    console.error('Memes error:', err)
    await reply('❌ Failed to load memes. Please try again later.')
  }
}