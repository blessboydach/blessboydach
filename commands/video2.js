// ============================================================
//  VANGUARD MD — commands/video.js
//  YouTube → mp4 playable video
// ============================================================

const axios    = require('axios')
const yts      = require('yt-search')
const config   = require('../config')
const defaults = require('../defaults')

const AXIOS_OPTS = {
  timeout: 60000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept':     'application/json, text/plain, */*',
  },
}

const tryRequest = async (fn, attempts = 3) => {
  let lastErr
  for (let i = 1; i <= attempts; i++) {
    try { return await fn() } catch (err) {
      lastErr = err
      if (i < attempts) await new Promise(r => setTimeout(r, 1000 * i))
    }
  }
  throw lastErr
}

const apis = [
  async (url) => {
    const r = await tryRequest(() => axios.get('https://eliteprotech-apis.zone.id/ytdown?url=' + encodeURIComponent(url) + '&format=mp4', AXIOS_OPTS))
    if (r?.data?.success && r?.data?.downloadURL) return { download: r.data.downloadURL, title: r.data.title }
    throw new Error('no download')
  },
  async (url) => {
    const r = await tryRequest(() => axios.get('https://api.yupra.my.id/api/downloader/ytmp4?url=' + encodeURIComponent(url), AXIOS_OPTS))
    if (r?.data?.success && r?.data?.data?.download_url) return { download: r.data.data.download_url, title: r.data.data.title, thumbnail: r.data.data.thumbnail }
    throw new Error('no download')
  },
  async (url) => {
    const r = await tryRequest(() => axios.get('https://okatsu-rolezapiiz.vercel.app/downloader/ytmp4?url=' + encodeURIComponent(url), AXIOS_OPTS))
    if (r?.data?.result?.mp4) return { download: r.data.result.mp4, title: r.data.result.title }
    throw new Error('no download')
  },
]

const getVideoData = async (url) => {
  for (const api of apis) {
    try {
      const data = await api(url)
      if (data?.download) return data
    } catch (_) {}
  }
  throw new Error('All download sources failed')
}

const getYtId = (url) => (url.match(/(?:youtu\.be\/|v=)([a-zA-Z0-9_-]{11})/) || [])[1]
const isYtUrl = (url) => /(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/|playlist\?list=)?)([a-zA-Z0-9_-]{11})/i.test(url)

module.exports = async (ctx) => {
  const { sock, msg, jid, args, reply } = ctx

  const query = args.join(' ').trim()
  if (!query) return reply(
    '╭───────────────━⊷\n' +
    '┃ 🎬 *VIDEO DOWNLOADER*\n' +
    '╰───────────────━⊷\n' +
    '╭───────────────━⊷\n' +
    '┃ _Usage: .video <url or search>_\n' +
    '╰───────────────━⊷'
  )

  const botName = config.botName || defaults.botName || 'VANGUARD MD'

  let videoUrl   = ''
  let videoTitle = ''
  let videoThumb = ''

  if (query.startsWith('http://') || query.startsWith('https://')) {
    videoUrl = query
  } else {
    await reply('🔍 *Searching YouTube...*')
    const { videos } = await yts(query)
    if (!videos?.length) return reply('❌ No videos found!')
    videoUrl   = videos[0].url
    videoTitle = videos[0].title
    videoThumb = videos[0].thumbnail
  }

  if (!isYtUrl(videoUrl)) return reply('❌ Invalid YouTube link!')

  try {
    const ytId = getYtId(videoUrl)
    const thumb = videoThumb || (ytId ? 'https://i.ytimg.com/vi/' + ytId + '/sddefault.jpg' : null)
    if (thumb) {
      await sock.sendMessage(jid, {
        image:   { url: thumb },
        caption: '*' + (videoTitle || query) + '*\n⏳ _Please wait..._',
      }, { quoted: msg })
    } else {
      await reply('⏳ *Please wait...*')
    }
  } catch (_) {
    await reply('⏳ *Please wait...*')
  }

  let videoData
  try {
    videoData = await getVideoData(videoUrl)
  } catch (err) {
    return reply('❌ Download failed: ' + err.message)
  }

  const title     = videoData.title || videoTitle || query
  const cleanName = title.replace(/[^\w\s-]/g, '').trim()

  await sock.sendMessage(jid, {
    video:    { url: videoData.download },
    mimetype: 'video/mp4',
    fileName: cleanName + '.mp4',
    caption:
      '*' + title + '*\n\n' +
      '━━━━━━━━━━━━━━━━━━━━━\n' +
      '> _Powered by ' + botName + '_ 🔥',
  }, { quoted: msg })
}
