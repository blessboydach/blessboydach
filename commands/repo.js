// ============================================================
//  VANGUARD MD — commands/repo.js
//  Shows public repo info with ASCII style
// ============================================================

const axios = require('axios')
const path  = require('path')
const fs    = require('fs')

// Format date to DD/MM/YY - HH:mm:ss
const formatDate = (isoString) => {
  const d = new Date(isoString)
  const pad = (n) => n.toString().padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear().toString().slice(2)} - ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

module.exports = async (ctx) => {
  const { sock, msg, jid, reply } = ctx

  try {
    // Fetch public decoy repo data
    const { data: json } = await axios.get(
      'https://api.github.com/repos/mradminblue/vanguardmd',
      { 
        headers: { 'User-Agent': 'VanguardBot/2.0' },
        timeout: 10000 
      }
    )

    // ✅ FIX: Size in KB (GitHub API returns size in KB already, no division needed)
    // Actually GitHub API returns size in KB, so we display as-is or convert properly
    const sizeKB = json.size // GitHub returns KB
    const sizeDisplay = sizeKB > 1024 
      ? `${(sizeKB / 1024).toFixed(2)} MB` 
      : `${sizeKB} KB`

    // ✅ FIX: Add /fork to link for instant fork action
    const forkUrl = `${json.html_url}/fork`

    // Build ASCII-style message
    let txt = '╭───────────────━⊷\n'
    txt +=    '┃ 🤖 *VANGUARD MD*\n'
    txt +=    '╰───────────────━⊷\n'
    txt +=    '╭───────────────━⊷\n'
    txt +=    `┃ ✩ *Name*     : ${json.name}\n`
    txt +=    `┃ ✩ *Watchers* : ${json.subscribers_count || 0}\n`
    txt +=    `┃ ✩ *Size*     : ${sizeKB} KB\n`  // ✅ Raw KB count
    txt +=    `┃ ✩ *Updated*  : ${formatDate(json.updated_at)}\n`
    txt +=    `┃ ✩ *Forks*    : ${json.forks_count}\n`
    txt +=    `┃ ✩ *Stars*    : ${json.stargazers_count}\n`
    txt +=    '╰───────────────━⊷\n'
    txt +=    '╭───────────────━⊷\n'
    txt +=    `┃ 🔗 *Fork and Star The Repo*\n`
    txt +=    `┃ 🖇️ *Repo:* ${forkUrl}\n`  // ✅ Tap to fork instantly
    txt +=    '╰───────────────━⊷\n'
    txt +=    '💥 *Vanguard MD* 💥 '

    // Try image first, fallback to text
    try {
      const imgPath = path.join(__dirname, '..', 'assets', 'botimage.jpg')
      
      if (fs.existsSync(imgPath)) {
        const imgBuffer = fs.readFileSync(imgPath)
        await sock.sendMessage(jid, { 
          image: imgBuffer, 
          caption: txt 
        }, { quoted: msg })
      } else {
        await reply(txt)
      }
    } catch (imgErr) {
      await reply(txt)
    }

  } catch (err) {
    // Silent fail - never expose real repo
    await reply(
      '╭───────────────━⊷\n' +
      '┃ ❌ *REPO INFO*\n' +
      '╰───────────────━⊷\n' +
      '╭───────────────━⊷\n' +
      '┃ _Repository data temporarily unavailable_\n' +
      '┃ _Please try again later_\n' +
      '╰───────────────━⊷'
    )
  }
}
