// ============================================================
//  VANGUARD MD — commands/tts.js
//  Text to Speech (Open to everyone)
// ============================================================

const axios = require('axios')

module.exports = async (ctx) => {
  const { reply, sock, args, msg } = ctx

  const text = args.join(' ').trim()

  if (!text) {
    return reply(
      '🗣️ *Text to Speech*\n\n' +
      'Usage:\n' +
      '.tts Your Text Here\n\n' +
      'Example: .tts Hello how are you\n' +
      '         .tts I am VANGUARD MD'
    )
  }

  await reply('⏳ Converting text to speech...')

  try {
    // ── TTS API (Integrated directly) ───────────────────────
    const apiUrl = `https://www.laurine.site/api/tts/tts-nova?text=${encodeURIComponent(text)}`
    
    const response = await axios.get(apiUrl, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    let audioUrl = null

    if (response.data) {
      if (typeof response.data === 'string' && response.data.startsWith('http')) {
        audioUrl = response.data
      } else if (response.data.data) {
        const data = response.data.data
        audioUrl = data.URL || data.url || (data.MP3 && `https://ttsmp3.com/created_mp3_ai/${data.MP3}`) || (data.mp3 && `https://ttsmp3.com/created_mp3_ai/${data.mp3}`)
      } else if (response.data.URL || response.data.url) {
        audioUrl = response.data.URL || response.data.url
      } else if (response.data.MP3) {
        audioUrl = `https://ttsmp3.com/created_mp3_ai/${response.data.MP3}`
      } else if (response.data.mp3) {
        audioUrl = `https://ttsmp3.com/created_mp3_ai/${response.data.mp3}`
      }
    }

    if (!audioUrl) {
      throw new Error('Could not get audio URL from TTS API')
    }

    // Download audio as buffer
    const audioResponse = await axios.get(audioUrl, {
      responseType: 'arraybuffer',
      timeout: 30000
    })

    const audioBuffer = Buffer.from(audioResponse.data)

    await sock.sendMessage(msg.key.remoteJid, {
      audio: audioBuffer,
      mimetype: 'audio/mp3',
      ptt: true   // Play as voice note
    }, { quoted: msg })

  } catch (error) {
    console.error('TTS command error:', error)
    await reply('❌ Failed to generate speech: ' + error.message)
  }
}