// ============================================================
//  VANGUARD MD — lib/audioEffects.js
//  Shared audio effects helper — all effect commands point here
// ============================================================

const { downloadContentFromMessage } = require('@whiskeysockets/baileys')
const fs   = require('fs')
const path = require('path')
const { exec } = require('child_process')

// ── Effect filter map ─────────────────────────────────────────
const FILTERS = {
  bass:      'equalizer=f=94:width_type=o:width=2:g=30',
  blown:     'acrusher=.1:1:64:0:log',
  deep:      'atempo=1,asetrate=44500*2/3',
  earrape:   'volume=12',
  fast:      'atempo=1.63',
  fat:       'atempo=1.6',
  nightcore: 'atempo=1.06',
  reverse:   'areverse',
  robot:     "afftfilt=real='hypot(re,im)*sin(0)':imag='hypot(re,im)*cos(0)'",
  slow:      'atempo=0.7',
  chipmunk:  'atempo=0.5',
}

const EFFECTS_MENU =
  '🎧 *Audio Effects*\n\n' +
  '• *bass* — Heavy bass boost\n' +
  '• *blown* — Distorted blown out\n' +
  '• *deep* — Deep slowed voice\n' +
  '• *earrape* — Loud ear destruction 🔊\n' +
  '• *fast* — Sped up\n' +
  '• *fat* — Fat pitched down\n' +
  '• *nightcore* — Nightcore effect\n' +
  '• *reverse* — Reversed audio\n' +
  '• *robot* — Robot voice\n' +
  '• *slow* — Slowed down\n' +
  '• *chipmunk* — Chipmunk voice\n\n' +
  '📌 *Usage:* Reply to a voice note / audio with the command\n' +
  '_Example: .bass_'

// ── Download quoted audio ─────────────────────────────────────
const getAudio = async (msg) => {
  const m      = msg.message || {}
  const quoted = m.extendedTextMessage?.contextInfo?.quotedMessage || {}

  const audio =
    m.audioMessage      ||
    m.voiceMessage      ||
    quoted.audioMessage ||
    quoted.voiceMessage ||
    null

  if (!audio) return null

  try {
    const stream = await downloadContentFromMessage(audio, 'audio')
    const chunks = []
    for await (const chunk of stream) chunks.push(chunk)
    return Buffer.concat(chunks)
  } catch (_) { return null }
}

// ── Main effect processor ─────────────────────────────────────
const applyEffect = async (ctx, effectName) => {
  const { reply, sock, msg, jid } = ctx

  const filter = FILTERS[effectName]
  if (!filter) return reply('❌ Unknown effect: ' + effectName)

  const audioBuffer = await getAudio(msg)
  if (!audioBuffer) {
    return reply(EFFECTS_MENU)
  }

  await reply('⏳ Applying *' + effectName + '* effect...')

  try {
    const tmp = path.join(process.cwd(), 'tmp')
    if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true })

    const input  = path.join(tmp, 'vmd_in_'  + Date.now() + '.ogg')
    const output = path.join(tmp, 'vmd_out_' + Date.now() + '.ogg')

    fs.writeFileSync(input, audioBuffer)

    exec(
      `ffmpeg -y -i "${input}" -af "${filter},aresample=48000,asetpts=N/SR" -c:a libopus -b:a 64k -ac 1 "${output}"`,
      async (err) => {
        if (err) {
          try { fs.unlinkSync(input) } catch (_) {}
          try { await reply('❌ ffmpeg error: ' + err.message.slice(0, 200)) } catch (_) {}
          return
        }

        try {
          const out = fs.readFileSync(output)
          await sock.sendMessage(jid, {
            audio:    out,
            mimetype: 'audio/ogg; codecs=opus',
            ptt:      true,
          }, { quoted: msg })
        } catch (_) {
          try { await reply('❌ Failed to send processed audio.') } catch (_) {}
        } finally {
          try { fs.unlinkSync(input)  } catch (_) {}
          try { fs.unlinkSync(output) } catch (_) {}
        }
      }
    )
  } catch (err) {
    await reply('❌ Audio processing failed. Try Again Later.')
  }
}

module.exports = { applyEffect, EFFECTS_MENU, FILTERS }
