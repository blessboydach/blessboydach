// ============================================================
//  VANGUARD MD — commands/say.js
//  Instant Text to Speech (No Loading Message)
// ============================================================

const googleTTS = require('google-tts-api')

module.exports = async (ctx) => {
  const { reply, sock, args, msg } = ctx

  let text = args.join(' ').trim()

  if (!text) {
    return reply(
      '🗣️ *Say Command*\n' +
      'Usage:\n' +
      '/say Your text here → English by default\n' +
      'For other languages:\n' +
      '/say #fr Bonjour\n' +
      '/say #sw Habari yako\n' +
      'Only 2-letter language codes allowed.'
    )
  }

  let language = 'en' // default

  // ── Language detection (#fr, #sw etc) ─────────────────────
  const firstWord = args[0]
  if (firstWord && firstWord.startsWith('#')) {
    const code = firstWord.slice(1).toLowerCase()

    if (/^[a-z]{2}$/.test(code)) {
      language = code
      text = args.slice(1).join(' ').trim()
    } else {
      return reply('❌ Invalid language code. Use 2-letter codes like #fr, #sw')
    }
  }

  if (!text) {
    return reply('❌ Provide text after language code.')
  }

  if (text.length > 200) {
    return reply('❌ Max 200 characters allowed.')
  }

  try {
    // ── Generate TTS ─────────────────────
    const audioBase64 = await googleTTS.getAudioBase64(text, {
      lang: language,
      slow: false,
      host: 'https://translate.google.com',
    })

    const audioBuffer = Buffer.from(audioBase64, 'base64')

    // ⚡ Direct send — no loading message
    await sock.sendMessage(msg.key.remoteJid, {
      audio: audioBuffer,
      mimetype: 'audio/ogg; codecs=opus',
      ptt: true
    }, { quoted: msg })

  } catch (error) {
    console.error('Say command error:', error)
    await reply('❌ Failed: ' + error.message)
  }
}
