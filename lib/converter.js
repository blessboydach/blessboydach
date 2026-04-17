// ============================================================
// VANGUARD MD — lib/converter.js
// Buffer -> MP3 converter using ffmpeg
// temp folder: ./temp
// ============================================================

const fs = require('fs')
const path = require('path')
const { execFile } = require('child_process')

const TEMP_DIR = path.join(__dirname, '../temp')

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true })
}

const execFileAsync = (file, args) =>
  new Promise((resolve, reject) => {
    execFile(file, args, { windowsHide: true }, (err) => {
      if (err) return reject(err)
      resolve()
    })
  })

/**
 * Convert any audio buffer to MP3 buffer.
 * @param {Buffer} buffer
 * @param {string} inputExt
 */
async function toAudio(buffer, inputExt = 'm4a') {
  const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`
  const inputPath = path.join(TEMP_DIR, `${id}.${inputExt}`)
  const outputPath = path.join(TEMP_DIR, `${id}.mp3`)

  fs.writeFileSync(inputPath, buffer)

  try {
    await execFileAsync('ffmpeg', [
      '-y',
      '-i', inputPath,
      '-vn',
      '-acodec', 'libmp3lame',
      '-ab', '192k',
      outputPath
    ])

    return fs.readFileSync(outputPath)
  } finally {
    try { fs.unlinkSync(inputPath) } catch {}
    try { fs.unlinkSync(outputPath) } catch {}
  }
}

module.exports = { toAudio }