// ============================================================
//  VANGUARD MD — commands/autoreact.js
// ============================================================

const config   = require('../config')
const defaults = require('../defaults')
const fs       = require('fs')
const path     = require('path')

const VALID       = ['off', 'all', 'groups', 'dms', 'custom']
const HELPER_FILE = path.join(__dirname, '..', 'data', 'autoreacthelper.json')

// ── Default emoji library ─────────────────────────────────────
const DEFAULT_EMOJIS = [
  '😂','😭','❤️','🥰','😳','🙌','🥲','😍','🔥','💀','😤','🙏','🙄','🗿',
  '🙂','😁','😘','😏','🥵','🫣','🤗','👄','😎','🥳','😕','😋','😌','😩',
  '😒','🤔','👍','🤧','🤤','🫠','🤭','😆','😅','🤣','😊','😇','🥹','😉',
  '😜','😝','😛','🤑','😠','😡','🤬','😈','👿','💯','🫶','👏','🤝','💪',
  '🤙','👌','✌️','🤞','🫰','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔',
  '❣️','💕','💞','💓','💗','💖','💘','💝','💫','⭐','🌟','✨','🎉','🎊',
  '🏆','🥇','🎯','💥','💢','💨','💦','🌈','⚡','🎶','🎵','👑','💎','🫧',
  '🧿','🎀','🙈','🙉','🙊','🐐','🦁','🐯','🦊','🦄','🐉','🦋','🌹','🌺',
  '🌸','🍀','🌙','☀️','🌊','🏔️','🤡','👻','☠️','🥶','🥴','🤢','🥸','🧐',
  '🤓','🎭','🎲','🎮','🏅','🥈','🥉','🚀','🛸','🌍','🌎','🌏','🗺️','🌋',
  '🌅','🌄','🌠','🌌','🌃','🏙️','🌆','🌇','🌉','🎆','🎇','🏰','🏯','🕌',
  '⛪','🕍','🩷','🩵','🩶','🫀','🫁','🧠','👀','👁️','💅','🫦','🦷','🦴',
  '🐾','🌿','🍃','🌾','🍁','🍂','🌻','🌼','🌷','🌱','🌵','🎋','🎍','🪴',
]

// ── Load emoji library ────────────────────────────────────────
const loadEmojis = () => {
  try {
    if (fs.existsSync(HELPER_FILE)) {
      return JSON.parse(fs.readFileSync(HELPER_FILE, 'utf8'))
    }
  } catch (_) {}
  // ── Write defaults if missing ─────────────────────────────
  try {
    fs.mkdirSync(path.dirname(HELPER_FILE), { recursive: true })
    fs.writeFileSync(HELPER_FILE, JSON.stringify(DEFAULT_EMOJIS, null, 2))
  } catch (_) {}
  return DEFAULT_EMOJIS
}

module.exports = async (ctx) => {
  const { reply, args, isSudo } = ctx
  if (!isSudo) return reply('❌ Owner/sudo only!')

  const scope = args[0]?.toLowerCase()

  if (!scope || !VALID.includes(scope)) {
    const cur     = config.autoReact     ?? defaults.autoReact     ?? 'off'
    const customs = config.autoReactCustom ?? defaults.autoReactCustom ?? []
    const library = loadEmojis()
    return reply(
      '❤️ *AUTO REACT*\n' +
      '📍 *Current:* ' + cur + '\n' +
      (customs.length ? '🎨 *Custom:* ' + customs.join(' ') + '\n' : '') +
      '📚 *Library:* ' + library.length + ' emojis\n' +
      '*Usage:* .autoreact <scope>\n' +
      '• off    — disabled\n' +
      '• all    — everywhere\n' +
      '• groups — groups only\n' +
      '• dms    — DMs only\n' +
      '• custom 🩷😇 — set custom emojis\n' +
      ''
    )
  }

  // ── Custom emoji setter ───────────────────────────────────
  if (scope === 'custom') {
    const emojiArgs = args.slice(1).join(' ').trim()
    if (!emojiArgs) {
      return reply('❌ _Provide emojis! Example: .autoreact custom 🩷😇😌_')
    }

    // ── Extract individual emojis using Segmenter ─────────
    const segments = [...new Intl.Segmenter().segment(emojiArgs)]
    const emojis   = segments
      .map(s => s.segment.trim())
      .filter(s => s.length > 0)

    if (!emojis.length) return reply('❌ _No valid emojis found!_')

    config.autoReactCustom = emojis
    config.autoReact       = 'all'  // auto-enable on custom set

    return reply(
      '❤️ *AUTO REACT*\n' +
      '🎨 *Custom set!*\n' +
      '' + emojis.join(' ') + '\n' +
      '_Auto react enabled with custom emojis_\n' +
      ''
    )
  }

  // ── Scope setter ──────────────────────────────────────────
  config.autoReact = scope

  // ── Clear custom on off ───────────────────────────────────
  if (scope === 'off') config.autoReactCustom = []

  await reply(
    '❤️ *AUTO REACT*\n' +
    (scope === 'off'
      ? '❌ *OFF* — Auto react disabled\n'
      : '✅ *' + scope.toUpperCase() + '* — Reacting in ' + scope + '\n' +
        '_Using library emojis randomly_\n') +
    ''
  )
}
