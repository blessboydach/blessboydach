// ============================================================
//  VANGUARD MD — commands/toaudio.js
//  Video to Audio Converter (Integrated)
// ============================================================

const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')

module.exports = async (ctx) => {
  const { sock, jid, msg, quoted, reply } = ctx

  // 1. Validation: Check if the user is replying to a video
  const mime = quoted?.mimetype || ""
  if (!quoted || !/video/.test(mime)) {
    return reply('❌ *Error:* Please reply to a video message to convert it to audio.')
  }

  await reply('⏳ *Extracting audio stream...*')

  try {
    // 2. Setup Paths
    const TEMP_DIR = path.join(__dirname, '..', 'temp')
    if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true })

    const inputPath = path.join(TEMP_DIR, `vid_${Date.now()}.mp4`)
    const outputPath = path.join(TEMP_DIR, `audio_${Date.now()}.mp3`)

    // 3. Download the video from WhatsApp
    const buffer = await quoted.download()
    fs.writeFileSync(inputPath, buffer)

    // 4. Run FFMPEG Conversion
    // -vn: disable video, -ar: audio rate, -ac: audio channels, -b:a: bitrate
    exec(`ffmpeg -i ${inputPath} -vn -ar 44100 -ac 2 -b:a 192k ${outputPath}`, async (err) => {
      if (err) {
        console.error('FFMPEG Error:', err)
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath)
        return reply('❌ *Conversion Failed:* The video file might be corrupted.')
      }

      // 5. Send as Audio (Voice Note style)
      await sock.sendMessage(jid, {
        audio: fs.readFileSync(outputPath),
        mimetype: 'audio/mp4',
        ptt: true // Set to false if you want it as a regular file
      }, { quoted: msg })

      // 6. Cleanup 🧹
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath)
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
    })

  } catch (error) {
    console.error('ToAudio Error:', error)
    await reply(`❌ *System Error:* ${error.message}`)
  }
}
