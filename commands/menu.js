// ============================================================
//  VANGUARD MD — commands/menu.js
// ============================================================

const fs       = require('fs')
const path     = require('path')
const config   = require('../config')
const defaults = require('../defaults')
const { formatUptime } = require('../lib/utils')

const LOCAL_IMAGE  = path.join(__dirname, '../assets/botimage.jpg')
const QUOTES_FILE  = path.join(__dirname, '../data/quotes.json')

// ── Load random quote ─────────────────────────────────────────
const getRandomQuote = () => {
try {
if (fs.existsSync(QUOTES_FILE)) {
const quotes = JSON.parse(fs.readFileSync(QUOTES_FILE, 'utf8'))
if (quotes.length) {
const q = quotes[Math.floor(Math.random() * quotes.length)]
return `_"${q.quote}"_`
}
}
} catch (_) {}
return '_“The best way to predict the future is to create it.”_'
}

// ── Fake realistic ping from your allowed ranges ─────────────
const getFakePing = () => {
  const ranges = [
    [34, 100],
    [200, 299],
    [316, 466],
    [950, 1000]
  ]
  const [min, max] = ranges[Math.floor(Math.random() * ranges.length)]
  return Math.floor(Math.random() * (max - min + 1)) + min
}

module.exports = async (ctx) => {
const { sock, msg, jid, sender, senderNum } = ctx

const prefix   = config.prefix      || defaults.prefix      || '.'
const botName  = config.botName     || defaults.botName     || 'VANGUARD MD'
const mode     = config.mode        || defaults.mode        || 'public'
const owner    = config.ownerNumber || defaults.ownerNumber || ''
const ownerJid = owner ? owner + '@s.whatsapp.net' : null
const uptime   = formatUptime(process.uptime())
const time     = new Date().toLocaleString('en-KE', {
timeZone: 'Africa/Nairobi',
hour12:   true,
weekday:  'short',
year:     'numeric',
month:    'short',
day:      'numeric',
hour:     '2-digit',
minute:   '2-digit',
})

// ── Realistic fake ping + RAM percentage ─────────────────────
const pingValue = getFakePing()
const ping      = pingValue + 'ms'

// RAM: every ~100ms of ping = 10% (max 100%)
const ramPercent = Math.min(100, Math.floor(pingValue / 10))
const progressBar = '█'.repeat(Math.floor(ramPercent / 10)) + '░'.repeat(10 - Math.floor(ramPercent / 10))

const start    = Date.now()
const p        = prefix === 'none' || prefix === '' ? '' : prefix

const cmdCount = fs.readdirSync(path.join(__dirname))
.filter(f => f.endsWith('.js') && f !== 'menu.js').length

const quote = getRandomQuote()

const menu =
'╭───────────────━⊷\n' +
'┃ *🤖 ' + botName + ' 🤖*\n' +
'╰───────────────━⊷\n' +
'╭───────────────━⊷\n' +
'┃ 🧑‍💻 *Owner:* @' + owner + '\n' +
'┃ 🛠️ *Prefix:* ' + (p || 'none') + '\n' +
'┃ 👥 *User:* @' + senderNum + '\n' +
'┃ 💾 *Host:* Panel\n' +
'┃ ⚡ *Speed:* ' + ping + '\n' +
'┃ 💿 *Ram* : [' + progressBar + '] ' + ramPercent + '%\n' +
'┃ 💻 *Version:* 2.1.8\n' +
'┃ 🛡️ *Mode:* ' + mode.toUpperCase() + '\n' +
'┃ 🕐 *Time:* ' + time + '\n' +
'┃ ⏱️ *Uptime:* ' + uptime + '\n' +
'┃ 🧩 *Modules:* ' + cmdCount + '+\n' +
'┃ 🥤 *Developer:* Mr.Admin Blue\n' +
'╰───────────────━⊷\n' +
'╭───────────────━⊷\n' +
'┃ 💬 *Quote:*\n' +
'┃ ' + quote + '\n' +
'╰───────────────━⊷\n' +
'\n' +

// ── 1. OWNER ──────────────────────────────────────────────
'╭─┴❍「 👑 OWNER 」❍\n' +
'│★ ' + p + 'ban\n' +
'│★ ' + p + 'block\n' +
'│★ ' + p + 'broadcast\n' +
'│★ ' + p + 'channeljid\n' +
'│★ ' + p + 'chjid\n' +
'│★ ' + p + 'clearban\n' +
'│★ ' + p + 'cleartemp\n' +
'│★ ' + p + 'delete\n' +
'│★ ' + p + 'exit\n' +
'│★ ' + p + 'getpp\n' +
'│★ ' + p + 'groups\n' +
'│★ ' + p + 'inbox\n' +
'│★ ' + p + 'join\n' +
'│★ ' + p + 'leave\n' +
'│★ ' + p + 'listban\n' +
'│★ ' + p + 'listblocked\n' +
'│★ ' + p + 'mode\n' +
'│★ ' + p + 'private\n' +
'│★ ' + p + 'public\n' +
'│★ ' + p + 'resetmenuimg\n' +
'│★ ' + p + 'restart\n' +
'│★ ' + p + 'setbotname\n' +
'│★ ' + p + 'setownername\n' +
'│★ ' + p + 'setownernumber\n' +
'│★ ' + p + 'setmenuimg\n' +
'│★ ' + p + 'setpp\n' +
'│★ ' + p + 'temprepo\n' +
'│★ ' + p + 'unban\n' +
'│★ ' + p + 'unbanall\n' +
'│★ ' + p + 'unblock\n' +
'│★ ' + p + 'update\n' +
'│★ ' + p + 'vanguardsend\n' +
'│★ ' + p + 'vanguardspam\n' +
'│★ ' + p + 'vanguardspam2\n' +
'│★ ' + p + 'vanguardspam3\n' +
'│★ ' + p + 'vv\n' +
'│★ ' + p + 'vv2\n' +
'╰─┬────────❍\n' +
'\n' +

// ── 2. OWNER SECURITY ─────────────────────────────────────
'╭─┴❍「 🔐 OWNER SECURITY 」❍\n' +
'│★ ' + p + 'adddmban\n' +
'│★ ' + p + 'adddmsudo\n' +
'│★ ' + p + 'addgban\n' +
'│★ ' + p + 'addgsudo\n' +
'│★ ' + p + 'addignorelist\n' +
'│★ ' + p + 'addsudo\n' +
'│★ ' + p + 'cleardmban\n' +
'│★ ' + p + 'cleardmsudo\n' +
'│★ ' + p + 'cleargban\n' +
'│★ ' + p + 'cleargsudo\n' +
'│★ ' + p + 'clearignorelist\n' +
'│★ ' + p + 'clearsudo\n' +
'│★ ' + p + 'listdmban\n' +
'│★ ' + p + 'listdmsudo\n' +
'│★ ' + p + 'listgban\n' +
'│★ ' + p + 'listgsudo\n' +
'│★ ' + p + 'listignorelist\n' +
'│★ ' + p + 'listsudo\n' +
'│★ ' + p + 'remdmban\n' +
'│★ ' + p + 'remdmsudo\n' +
'│★ ' + p + 'remgban\n' +
'│★ ' + p + 'remgsudo\n' +
'│★ ' + p + 'remignorelist\n' +
'│★ ' + p + 'remsudo\n' +
'╰─┬────────❍\n' +
'\n' +

// ── 3. SETTINGS ───────────────────────────────────────────
'╭─┴❍「 ⚙️ SETTINGS 」❍\n' +
'│★ ' + p + 'alwayonline\n' +
'│★ ' + p + 'anticall\n' +
'│★ ' + p + 'anticallmode\n' +
'│★ ' + p + 'anticallmsg\n' +
'│★ ' + p + 'anticallreset\n' +
'│★ ' + p + 'anticallstatus\n' +
'│★ ' + p + 'anticalltest\n' +
'│★ ' + p + 'antidelete\n' +
'│★ ' + p + 'antideletestatus\n' +
'│★ ' + p + 'antiedit\n' +
'│★ ' + p + 'autobio\n' +
'│★ ' + p + 'autoreact\n' +
'│★ ' + p + 'autoreactstatus\n' +
'│★ ' + p + 'autoread\n' +
'│★ ' + p + 'autorecord\n' +
'│★ ' + p + 'autorecordtype\n' +
'│★ ' + p + 'autosavestatus\n' +
'│★ ' + p + 'autotype\n' +
'│★ ' + p + 'autoviewstatus\n' +
'│★ ' + p + 'chatbot\n' +
'│★ ' + p + 'close\n' +
'│★ ' + p + 'open\n' +
'│★ ' + p + 'setprefix\n' +
'│★ ' + p + 'statusemoji\n' +
'│★ ' + p + 'togstatus\n' +
'│★ ' + p + 'tostatus\n' +
'╰─┬────────❍\n' +
'\n' +

// ── 4. PRIVACY ────────────────────────────────────────────
'╭─┴❍「 🛡️ PRIVACY 」❍\n' +
'│★ ' + p + 'addbadword\n' +
'│★ ' + p + 'antibadword\n' +
'│★ ' + p + 'antigroupmention\n' +
'│★ ' + p + 'antilink\n' +
'│★ ' + p + 'antimedia\n' +
'│★ ' + p + 'antisticker\n' +
'│★ ' + p + 'resetlink\n' +
'│★ ' + p + 'toviewonce\n' +
'╰─┬────────❍\n' +
'\n' +

// ── 5. INFO ───────────────────────────────────────────────
'╭─┴❍「 📡 INFO 」❍\n' +
'│★ ' + p + 'alive\n' +
'│★ ' + p + 'botstatus\n' +
'│★ ' + p + 'check\n' +
'│★ ' + p + 'device\n' +
'│★ ' + p + 'getsettings\n' +
'│★ ' + p + 'gset\n' +
'│★ ' + p + 'help\n' +
'│★ ' + p + 'ms\n' +
'│★ ' + p + 'owner\n' +
'│★ ' + p + 'ping\n' +
'│★ ' + p + 'ping2\n' +
'│★ ' + p + 'repo\n' +
'│★ ' + p + 'runtime\n' +
'│★ ' + p + 'speed\n' +
'│★ ' + p + 'status\n' +
'│★ ' + p + 'time\n' +
'│★ ' + p + 'totalmembers\n' +
'│★ ' + p + 'uptime\n' +
'│★ ' + p + 'userid\n' +
'╰─┬────────❍\n' +
'\n' +

// ── 6. AI ─────────────────────────────────────────────────
'╭─┴❍「 🤖 AI 」❍\n' +
'│★ ' + p + 'claude\n' +
'│★ ' + p + 'gemini\n' +
'│★ ' + p + 'gpt\n' +
'│★ ' + p + 'grok\n' +
'│★ ' + p + 'meta\n' +
'│★ ' + p + 'liama\n' +
'│★ ' + p + 'meta\n' +
'│★ ' + p + 'story\n' +
'│★ ' + p + 'vangai\n' +
'╰─┬────────❍\n' +
'\n' +

// ── 7. GROUP ──────────────────────────────────────────────
'╭─┴❍「 👥 GROUP 」❍\n' +
'│★ ' + p + 'active\n' +
'│★ ' + p + 'add\n' +
'│★ ' + p + 'admins\n' +
'│★ ' + p + 'approve\n' +
'│★ ' + p + 'approveall\n' +
'│★ ' + p + 'cancel\n' +
'│★ ' + p + 'cancelkick\n' +
'│★ ' + p + 'cancelkickinactive\n' +
'│★ ' + p + 'demote\n' +
'│★ ' + p + 'gcgc\n' +
'│★ ' + p + 'gcgc2\n' +
'│★ ' + p + 'goodbye\n' +
'│★ ' + p + 'googbye\n' +
'│★ ' + p + 'groupinfo\n' +
'│★ ' + p + 'groupreset\n' +
'│★ ' + p + 'hidetag\n' +
'│★ ' + p + 'kick\n' +
'│★ ' + p + 'kickall\n' +
'│★ ' + p + 'kickinactive\n' +
'│★ ' + p + 'link\n' +
'│★ ' + p + 'listactive\n' +
'│★ ' + p + 'listinactive\n' +
'│★ ' + p + 'members\n' +
'│★ ' + p + 'mtag\n' +
'│★ ' + p + 'poll\n' +
'│★ ' + p + 'promactive\n' +
'│★ ' + p + 'promote\n' +
'│★ ' + p + 'remove\n' +
'│★ ' + p + 'resetlink\n' +
'│★ ' + p + 'setdesc\n' +
'│★ ' + p + 'setgpp\n' +
'│★ ' + p + 'setgroupname\n' +
'│★ ' + p + 'stalk\n' +
'│★ ' + p + 'tagall\n' +
'│★ ' + p + 'topactive\n' +
'│★ ' + p + 'warn\n' +
'│★ ' + p + 'welcome\n' +
'╰─┬────────❍\n' +
'\n' +

// ── 8. TOOLS & UTILITY ────────────────────────────────────
'╭─┴❍「 🛠️ TOOLS & UTILITY 」❍\n' +
'│★ ' + p + 'archive\n' +
'│★ ' + p + 'base64\n' +
'│★ ' + p + 'binary\n' +
'│★ ' + p + 'calculate\n' +
'│★ ' + p + 'cb\n' +
'│★ ' + p + 'clipboard\n' +
'│★ ' + p + 'genpass\n' +
'│★ ' + p + 'getfile\n' +
'│★ ' + p + 'gfile\n' +
'│★ ' + p + 'morse\n' +
'│★ ' + p + 'qrcode\n' +
'│★ ' + p + 'sentence\n' +
'│★ ' + p + 'shazam\n' +
'│★ ' + p + 'ss\n' +
'│★ ' + p + 'steal\n' +
'│★ ' + p + 'sticker\n' +
'│★ ' + p + 'stream\n' +
'│★ ' + p + 'take\n' +
'│★ ' + p + 'toimage\n' +
'│★ ' + p + 'toimg\n' +
'│★ ' + p + 'tomp4\n' +
'│★ ' + p + 'tovideo\n' +
'│★ ' + p + 'unarchive\n' +
'│★ ' + p + 'upload\n' +
'│★ ' + p + 'vcf\n' +
'╰─┬────────❍\n' +
'\n' +

// ── 9. SOUND MAGIC FX ─────────────────────────────────────
'╭─┴❍「 🎵 SOUND MAGIC FX 」❍\n' +
'│★ ' + p + 'audiofx\n' +
'│★ ' + p + 'bass\n' +
'│★ ' + p + 'blown\n' +
'│★ ' + p + 'chipmunk\n' +
'│★ ' + p + 'deep\n' +
'│★ ' + p + 'earrape\n' +
'│★ ' + p + 'fast\n' +
'│★ ' + p + 'fat\n' +
'│★ ' + p + 'nightcore\n' +
'│★ ' + p + 'reverse\n' +
'│★ ' + p + 'robot\n' +
'│★ ' + p + 'slow\n' +
'│★ ' + p + 'toaudio\n' +
'│★ ' + p + 'tts\n' +
'│★ ' + p + 'tts2\n' +
'│★ ' + p + 'tts3\n' +
'╰─┬────────❍\n' +
'\n' +

// ── 10. TEXT MAKER ────────────────────────────────────────
'╭─┴❍「 🎨 TEXT MAKER 」❍\n' +
'│★ ' + p + '1917\n' +
'│★ ' + p + 'arena\n' +
'│★ ' + p + 'blankpink\n' +
'│★ ' + p + 'devil\n' +
'│★ ' + p + 'fire\n' +
'│★ ' + p + 'glitch\n' +
'│★ ' + p + 'hacker\n' +
'│★ ' + p + 'ice\n' +
'│★ ' + p + 'leaves\n' +
'│★ ' + p + 'light\n' +
'│★ ' + p + 'matrix\n' +
'│★ ' + p + 'metallic\n' +
'│★ ' + p + 'neon\n' +
'│★ ' + p + 'purple\n' +
'│★ ' + p + 'sand\n' +
'│★ ' + p + 'snow\n' +
'│★ ' + p + 'thunder\n' +
'╰─┬────────❍\n' +
'\n' +

// ── 11. ANIME ─────────────────────────────────────────────
'╭─┴❍「 🥷 ANIME 」❍\n' +
'│★ ' + p + 'anime\n' +
'│★ ' + p + 'hneko\n' +
'│★ ' + p + 'hwaifu\n' +
'│★ ' + p + 'konachan\n' +
'│★ ' + p + 'loli\n' +
'│★ ' + p + 'megumin\n' +
'│★ ' + p + 'milf\n' +
'│★ ' + p + 'neko\n' +
'│★ ' + p + 'random\n' +
'│★ ' + p + 'waifu\n' +
'╰─┬────────❍\n' +
'\n' +

// ── 12. DOWNLOADER ────────────────────────────────────────
'╭─┴❍「 ⬇️ DOWNLOADER 」❍\n' +
'│★ ' + p + 'facebook\n' +
'│★ ' + p + 'iplay\n' +
'│★ ' + p + 'iplay2\n' +
'│★ ' + p + 'instagram\n' +
'│★ ' + p + 'music\n' +
'│★ ' + p + 'music2\n' +
'│★ ' + p + 'play\n' +
'│★ ' + p + 'play2\n' +
'│★ ' + p + 'song\n' +
'│★ ' + p + 'song2\n' +
'│★ ' + p + 'spotify\n' +
'│★ ' + p + 'telesticker\n' +
'│★ ' + p + 'tiktok\n' +
'│★ ' + p + 'video\n' +
'│★ ' + p + 'video2\n' +
'╰─┬────────❍\n' +
'\n' +

// ── 13. STATUS ────────────────────────────────────────────
'╭─┴❍「 👁️ STATUS 」❍\n' +
'│★ ' + p + 'fetch\n' +
'│★ ' + p + 'fetch2\n' +
'│★ ' + p + 'save\n' +
'│★ ' + p + 'save2\n' +
'│★ ' + p + 'vv\n' +
'│★ ' + p + 'vv2\n' +
'╰─┬────────❍\n' +
'\n' +

// ── 14. FUN & MISC ────────────────────────────────────────
'╭─┴❍「 🌸 FUN & MISC 」❍\n' +
'│★ ' + p + '8ball\n' +
'│★ ' + p + 'apk\n' +
'│★ ' + p + 'bible\n' +
'│★ ' + p + 'compliment\n' +
'│★ ' + p + 'dare\n' +
'│★ ' + p + 'didyk\n' +
'│★ ' + p + 'emojimix\n' +
'│★ ' + p + 'fact\n' +
'│★ ' + p + 'flirt\n' +
'│★ ' + p + 'goodnight\n' +
'│★ ' + p + 'impressive\n' +
'│★ ' + p + 'joke\n' +
'│★ ' + p + 'lyrics\n' +
'│★ ' + p + 'meme\n' +
'│★ ' + p + 'menu\n' +
'│★ ' + p + 'quote\n' +
'│★ ' + p + 'quran\n' +
'│★ ' + p + 'rate\n' +
'│★ ' + p + 'roast\n' +
'│★ ' + p + 'say\n' +
'│★ ' + p + 'ship\n' +
'│★ ' + p + 'tag\n' +
'│★ ' + p + 'translate\n' +
'│★ ' + p + 'truth\n' +
'│★ ' + p + 'wasted\n' +
'│★ ' + p + 'weather\n' +
'╰─┬────────❍\n' +
'\n' +

// ── 15. GAME ──────────────────────────────────────────────
'╭─┴❍「 🎮 GAME 」❍\n' +
'│★ ' + p + 'coin\n' +
'│★ ' + p + 'dice\n' +
'│★ ' + p + 'guess\n' +
'│★ ' + p + 'move\n' +
'│★ ' + p + 'quizz\n' +
'│★ ' + p + 'rps\n' +
'│★ ' + p + 'tictactoe\n' +
'╰─┬────────❍\n' +
'\n' +

// ── 16. ECONOMY ───────────────────────────────────────────
'╭─┴❍「 💰 ECONOMY 」❍\n' +
'│★ ' + p + 'balance\n' +
'│★ ' + p + 'daily\n' +
'│★ ' + p + 'farm\n' +
'│★ ' + p + 'ffarm\n' +
'│★ ' + p + 'leaderboard\n' +
'│★ ' + p + 'rob\n' +
'│★ ' + p + 'transfer\n' +
'│★ ' + p + 'work\n' +
'╰─┬────────❍\n' +
'\n' +

// ── 17. MANGA ─────────────────────────────────────────────
'╭─┴❍「 🗿 MANGA 」❍\n' +
'│★ ' + p + 'akira\n' +
'│★ ' + p + 'akiyama\n' +
'│★ ' + p + 'anna\n' +
'│★ ' + p + 'asuna\n' +
'│★ ' + p + 'ayuzawa\n' +
'│★ ' + p + 'boruto\n' +
'│★ ' + p + 'chiho\n' +
'│★ ' + p + 'chitoge\n' +
'│★ ' + p + 'deidara\n' +
'│★ ' + p + 'eba\n' +
'│★ ' + p + 'elaina\n' +
'│★ ' + p + 'emilia\n' +
'│★ ' + p + 'erza\n' +
'│★ ' + p + 'hestia\n' +
'│★ ' + p + 'hinata\n' +
'│★ ' + p + 'inori\n' +
'│★ ' + p + 'isuzu\n' +
'│★ ' + p + 'itachi\n' +
'│★ ' + p + 'itori\n' +
'│★ ' + p + 'kaga\n' +
'│★ ' + p + 'kagura\n' +
'│★ ' + p + 'kaori\n' +
'│★ ' + p + 'keneki\n' +
'│★ ' + p + 'kotori\n' +
'│★ ' + p + 'kurumi\n' +
'│★ ' + p + 'madara\n' +
'│★ ' + p + 'mikasa\n' +
'│★ ' + p + 'miku\n' +
'│★ ' + p + 'minato\n' +
'│★ ' + p + 'naruto\n' +
'│★ ' + p + 'nezuko\n' +
'│★ ' + p + 'sagiri\n' +
'│★ ' + p + 'sakura\n' +
'│★ ' + p + 'sasuke\n' +
'╰─┬────────❍\n' +
'\n' +
      // ── 18. FOOTBALL ⚽️ ─────────────────────────────────────────────
'╭─┴❍「 ⚽️ FOOTBALL 」❍\n' +
'│★ ' + p + 'leagues\n' +
'│★ ' + p + 'live\n' +
'│★ ' + p + 'epltable\n' +
'│★ ' + p + 'pl\n' +
'│★ ' + p + 'cl\n' +
'│★ ' + p + 'laliga\n' +
'│★ ' + p + 'bundesliga\n' +
'│★ ' + p + 'seriea\n' +
'│★ ' + p + 'ligue1\n' +
'│★ ' + p + 'standings pl\n' +
'│★ ' + p + 'fixtures pl\n' +
'│★ ' + p + 'results pl\n' +
'│★ ' + p + 'topscorers pl\n' +
'╰─┬────────❍\n' +
'\n' +
'> *🤖 ' + botName + '* | Made With Love By Admin Blue'

const mentions = [sender]
if (ownerJid) mentions.push(ownerJid)

try {
if (fs.existsSync(LOCAL_IMAGE)) {
await sock.sendMessage(jid, {
image:    fs.readFileSync(LOCAL_IMAGE),
caption:  menu,
mentions,
}, { quoted: msg })
} else {
await sock.sendMessage(jid, {
text:     menu,
mentions,
}, { quoted: msg })
}
} catch (_) {
await sock.sendMessage(jid, {
text:     menu,
mentions,
}, { quoted: msg })
}
}
