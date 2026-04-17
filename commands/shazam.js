// ============================================================
//  VANGUARD MD — commands/shazam.js
//  FINAL FIXED VERSION - 5s audio, 60s timeout
// ============================================================

const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const { downloadMediaMessage } = require('@whiskeysockets/baileys')
const ACRCloud = require('acrcloud')
const { promisify } = require('util')

const execPromise = promisify(exec)

const ACR_CONFIG = {
  host: 'identify-eu-west-1.acrcloud.com',
  access_key: 'f72eea4a7af2c005e876c09b11e6ec8d',
  access_secret: 'tX1NXYYWtyi8vH1n5xT5Mpr77Eo6T6ntTEuelEB7G',
  timeout: 60
}

module.exports = async (ctx) => {
  const { sock, msg, jid, reply, quoted } = ctx
  
  const target = quoted || msg
  const messageContent = target.message || {}
  const messageType = Object.keys(messageContent)[0] || ''
  
  const isAudio = messageType === 'audioMessage'
  const isVideo = messageType === 'videoMessage'
  const isVoice = messageType === 'voiceMessage'
  
  if (!isAudio && !isVideo && !isVoice) {
    return reply('🎵 Reply to an *audio*, *voice note*, or *video* with: `.shazam`')
  }

  let inputPath, outputPath
  
  const m = await sock.sendMessage(jid, {
    text: '╭───────────────━⊷\n' +
          '┃ 🔍 Shazam Started\n' +
          '╰───────────────━⊷\n' +
          '╭───────────────━⊷\n' +
          '┃ Status: Downloading...\n' +
          '╰───────────────━⊷'
  }, { quoted: msg })
  
  try {
    const buffer = await downloadMediaMessage(
      target,
      'buffer',
      {},
      { logger: require('pino')({ level: 'silent' }), reuploadRequest: sock.updateMediaMessage }
    )

    if (!buffer || buffer.length < 3000) throw new Error('Media too small')

    const tmpDir = path.join(process.cwd(), 'tmp')
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
    
    const timestamp = Date.now()
    const ext = isVideo ? 'mp4' : 'ogg'
    inputPath = path.join(tmpDir, `shazam_${timestamp}.${ext}`)
    outputPath = path.join(tmpDir, `shazam_${timestamp}.wav`)
    
    fs.writeFileSync(inputPath, buffer)

    await sock.sendMessage(jid, {
      text: '╭───────────────━⊷\n' +
            '┃ 🔍 Shazam Started\n' +
            '╰───────────────━⊷\n' +
            '╭───────────────━⊷\n' +
            '┃ Status: Converting audio...\n' +
            '╰───────────────━⊷',
      edit: m.key
    })

    // 🔥 FIX: Trim to 5 seconds only (was 12)
    await execPromise(`ffmpeg -y -i "${inputPath}" -vn -acodec pcm_s16le -ar 44100 -ac 1 -t 5 "${outputPath}" 2>&1`)
    if (!fs.existsSync(outputPath)) throw new Error('Conversion failed')
    
    const wavBuffer = fs.readFileSync(outputPath)
    if (wavBuffer.length < 5000) throw new Error('Audio too short (need 5+ seconds)')

    await sock.sendMessage(jid, {
      text: '╭───────────────━⊷\n' +
            '┃ 🔍 Shazam Started\n' +
            '╰───────────────━⊷\n' +
            '╭───────────────━⊷\n' +
            '┃ Status: Identifying song...\n' +
            '╰───────────────━⊷',
      edit: m.key
    })

    const acr = new ACRCloud(ACR_CONFIG)
    
    const identifyPromise = new Promise((resolve, reject) => {
      acr.identify(wavBuffer, (err, httpResponse, body) => {
        if (err) return reject(new Error(err.message))
        try {
          const parsed = typeof body === 'string' ? JSON.parse(body) : body
          console.log('[SHAZAM] Response:', JSON.stringify(parsed).substring(0, 300))
          resolve(parsed)
        } catch (e) {
          reject(new Error('Invalid response'))
        }
      })
    })
    
    // 🔥 FIX: 60 second timeout (was 25)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('ACRCloud timeout (60s)')), 60000)
    )
    
    const result = await Promise.race([identifyPromise, timeoutPromise])

    try { fs.unlinkSync(inputPath) } catch (_) {}
    try { fs.unlinkSync(outputPath) } catch (_) {}

    if (result.status?.code === 0 && result.metadata?.music?.length > 0) {
      const song = result.metadata.music[0]
      const title = song.title || 'Unknown'
      const artist = song.artists?.map(a => a.name).join(', ') || 'Unknown'
      const album = song.album?.name || ''
      const score = song.score ? Math.round(song.score) : 0
      const external = song.external_metadata
      
      let text = '╭───────────────━⊷\n' +
                 '┃ ✅ Song Found!\n' +
                 '╰───────────────━⊷\n' +
                 '╭───────────────━⊷\n' +
                 `┃ 🎵 Title: ${title}\n` +
                 `┃ 👤 Artist: ${artist}\n`
      
      if (album) text += `┃ 💿 Album: ${album}\n`
      if (score) text += `┃ 🎯 Match: ${score}%\n`
      text += '╰───────────────━⊷\n'
      
      if (external?.spotify?.track?.id) text += `\n🎧 https://open.spotify.com/track/${external.spotify.track.id}`
      if (external?.youtube?.vid) text += `\n📺 https://youtu.be/${external.youtube.vid}`
      
      await sock.sendMessage(jid, {
        text: text + '\n_Powered by Vanguard MD 🔥_',
        edit: m.key
      })
      
    } else {
      console.log('[SHAZAM] No match. Status:', result.status)
      await sock.sendMessage(jid, {
        text: '╭───────────────━⊷\n' +
              '┃ ❌ No Match\n' +
              '╰───────────────━⊷\n' +
              '╭───────────────━⊷\n' +
              '┃ • Song not in database\n' +
              '┃ • Audio quality too low\n' +
              '┃ • Try clearer 5-10s clip\n' +
              '╰───────────────━⊷',
        edit: m.key
      })
    }

  } catch (error) {
    if (inputPath) try { fs.unlinkSync(inputPath) } catch (_) {}
    if (outputPath) try { fs.unlinkSync(outputPath) } catch (_) {}
    
    console.error('[SHAZAM] Error:', error)
    
    await sock.sendMessage(jid, {
      text: '╭───────────────━⊷\n' +
            '┃ ❌ Error\n' +
            '╰───────────────━⊷\n' +
            '╭───────────────━⊷\n' +
            `┃ ${error.message}\n` +
            '╰───────────────━⊷',
      edit: m.key
    })
  }
}
