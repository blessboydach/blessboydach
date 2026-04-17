// ============================================================
//  VANGUARD MD — commands/tts2.js
//  Text to Speech (Google TTS) - Mr.Admin Blue 2026
// ============================================================

const googleTTS = require('google-tts-api')

module.exports = async (ctx) => {
  const { reply, sock, args, msg } = ctx

  let text = args.join(' ').trim()

  if (!text) {
    return reply(
      '🗣️ *Text to Speech 3*\n\n' +
      'Usage:\n' +
      '.tts3 Your text here \n\n' +
      'For other languages:\n' +
      '.tts3 #fr Bonjour comment ça va\n' +
      '.tts3 #hi Namaste\n' +
      '.tts3 #sw Habari yako\n\n' +
      'Only 2-letter codes after # are accepted.'
    )
  }

  await reply('⏳ Converting text to speech...')

  let language = 'en' // Default English

  // ── Check for language code format: #fr ─────────────────────
  const firstWord = args[0]
  if (firstWord && firstWord.startsWith('#')) {
    const code = firstWord.slice(1).toLowerCase() // remove #

    if (/^[a-z]{2}$/.test(code)) {
      language = code
      // Remove the #code from the text
      text = args.slice(1).join(' ').trim()
    } else {
      // Invalid code → strict reject
      return reply('❌ Invalid language code!\n\nUse correct format like:\n.tts3 #fr text\n.tts3 #hi text\n\nOnly 2-letter codes are allowed.')
    }
  }

  if (!text) {
    return reply('❌ Please write some text after the language code.')
  }

  if (text.length > 200) {
    return reply('❌ Text is too long! Maximum 200 characters allowed.')
  }

  try {
    // ── Generate Google TTS Audio ───────────────────────
    const audioBase64 = await googleTTS.getAudioBase64(text, {
      lang: language,
      slow: false,
      host: 'https://translate.google.com',
    })

    const audioBuffer = Buffer.from(audioBase64, 'base64')

    // Send as voice note
    await sock.sendMessage(msg.key.remoteJid, {
      audio: audioBuffer,
      mimetype: 'audio/ogg; codecs=opus',
      ptt: true
    }, { quoted: msg })

  } catch (error) {
    console.error('TTS2 command error:', error)
    await reply('❌ Failed to generate speech: ' + error.message)
  }
}
