// ============================================================
// VANGUARD MD — lib/audioDownloader.js
// Shared song/play downloader
// Front-end:
// 1) Searching...
// 2) thumbnail + info + footer
// 3) send media with real filename
// ============================================================

const axios = require('axios')
const yts = require('yt-search')
const config = require('../config')
const defaults = require('../defaults')
const { toAudio } = require('./converter')

const AXIOS_DEFAULTS = {
  timeout: 90000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': '*/*',
    'Accept-Encoding': 'identity'
  }
}

const wait = (ms) => new Promise(r => setTimeout(r, ms))

const sanitizeFileName = (name) => {
  return String(name || 'media')
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim() || 'media'
}

const tryRequest = async (getter, attempts = 3) => {
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await getter()
    } catch (err) {
      lastError = err
      if (attempt < attempts) await wait(1000 * attempt)
    }
  }
  throw lastError
}

async function getEliteProTechDownloadByUrl(youtubeUrl) {
  const apiUrl = `https://eliteprotech-apis.zone.id/ytdown?url=${encodeURIComponent(youtubeUrl)}&format=mp3`
  const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS))
  if (res?.data?.success && res?.data?.downloadURL) {
    return {
      download: res.data.downloadURL,
      title: res.data.title
    }
  }
  throw new Error('EliteProTech returned no download URL')
}

async function getYupraDownloadByUrl(youtubeUrl) {
  const apiUrl = `https://api.yupra.my.id/api/downloader/ytmp3?url=${encodeURIComponent(youtubeUrl)}`
  const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS))
  if (res?.data?.success && res?.data?.data?.download_url) {
    return {
      download: res.data.data.download_url,
      title: res.data.data.title,
      thumbnail: res.data.data.thumbnail
    }
  }
  throw new Error('Yupra returned no download URL')
}

async function getOkatsuDownloadByUrl(youtubeUrl) {
  const apiUrl = `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp3?url=${encodeURIComponent(youtubeUrl)}`
  const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS))
  if (res?.data?.dl) {
    return {
      download: res.data.dl,
      title: res.data.title,
      thumbnail: res.data.thumb
    }
  }
  throw new Error('Okatsu returned no download URL')
}

async function getAudioData(videoUrl) {
  const apiMethods = [
    { name: 'EliteProTech', method: () => getEliteProTechDownloadByUrl(videoUrl) },
    { name: 'Yupra', method: () => getYupraDownloadByUrl(videoUrl) },
    { name: 'Okatsu', method: () => getOkatsuDownloadByUrl(videoUrl) }
  ]

  for (const api of apiMethods) {
    try {
      const data = await api.method()
      if (data?.download) return data
    } catch (_) {}
  }

  throw new Error('All download sources failed')
}

function detectFormat(buffer) {
  if (!buffer || buffer.length < 8) return 'm4a'

  const first4 = buffer.slice(0, 4).toString('ascii')
  const first3 = buffer.slice(0, 3).toString('ascii')

  if (first4 === 'OggS') return 'ogg'
  if (first4 === 'RIFF') return 'wav'
  if (first3 === 'ID3') return 'mp3'
  if (buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0) return 'mp3'
  if (buffer.slice(4, 8).toString('ascii') === 'ftyp') return 'm4a'

  return 'm4a'
}

async function downloadBuffer(url) {
  const res = await axios.get(url, {
    ...AXIOS_DEFAULTS,
    responseType: 'arraybuffer',
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
    validateStatus: s => s >= 200 && s < 400
  })
  return Buffer.from(res.data)
}

async function sendPreview(sock, jid, quotedMsg, video, query) {
  const title = video.title || query || 'Unknown title'
  const thumb = video.thumbnail

  const caption =
    `*${title}*\n` +
    (video.timestamp ? `⏱ Duration: ${video.timestamp}\n` : '') +
    (video.author?.name ? `👤 Channel: ${video.author.name}\n` : '') +
    `\n> _Vanguard Md Retreaving Media ..Please Wait ⌛️_`

  if (thumb) {
    await sock.sendMessage(jid, {
      image: { url: thumb },
      caption
    }, { quoted: quotedMsg })
  } else {
    await sock.sendMessage(jid, {
      text: caption
    }, { quoted: quotedMsg })
  }
}

module.exports = async (ctx, mode = 'audio') => {
  const { sock, msg, jid, args, reply } = ctx

  const query = args.join(' ').trim()
  if (!query) {
    return reply(`❌ Usage: .${ctx.command} <song name or YouTube link>`)
  }

  const botName = config.botName || defaults.botName || 'VANGUARD MD'

  await reply('🔍 Searching...')

  let video = null

  try {
    if (/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(query)) {
      video = { url: query }
    } else {
      const search = await yts(query)
      if (!search?.videos?.length) return reply('❌ No results found!')
      video = search.videos[0]
    }

    if (!video?.url) video.url = query

    if (!video.thumbnail && video.url) {
      try {
        const ytId = (video.url.match(/(?:youtu\.be\/|v=|shorts\/)([a-zA-Z0-9_-]{11})/) || [])[1]
        if (ytId) video.thumbnail = `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`
      } catch (_) {}
    }

    await sendPreview(sock, jid, msg, video, query)

    const audioData = await getAudioData(video.url)
    const audioBuffer = await downloadBuffer(audioData.download)

    if (!audioBuffer || !audioBuffer.length) {
      return reply('❌ Downloaded audio buffer is empty')
    }

    const format = detectFormat(audioBuffer)

    let finalBuffer = audioBuffer
    if (format !== 'mp3') {
      finalBuffer = await toAudio(audioBuffer, format)
    }

    const fileTitle = sanitizeFileName(audioData.title || video.title || query)
    const fileName = `${fileTitle}.mp3`

    const finalCaption =
      `*${audioData.title || video.title || query}*\n\n` +
      `> _Powered by ${botName}_`

    if (mode === 'document') {
      await sock.sendMessage(jid, {
        document: finalBuffer,
        mimetype: 'audio/mpeg',
        fileName,
        caption: finalCaption
      }, { quoted: msg })
    } else {
      await sock.sendMessage(jid, {
        audio: finalBuffer,
        mimetype: 'audio/mpeg',
        ptt: false,
        fileName,
        caption: finalCaption
      }, { quoted: msg })
    }
  } catch (err) {
    console.error('Song command error:', err)

    let errorMessage = '❌ Failed to download song.'
    if (err.message?.includes('blocked')) {
      errorMessage = '❌ Download blocked. The content may be unavailable in your region or due to restrictions.'
    } else if (err.response?.status === 451 || err.status === 451) {
      errorMessage = '❌ Content unavailable (451).'
    } else if (err.message?.includes('All download sources failed')) {
      errorMessage = '❌ All download sources failed.'
    }

    await reply(errorMessage)
  }
}