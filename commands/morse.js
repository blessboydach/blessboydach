// ============================================================
//  VANGUARD MD — commands/morse.js
// ============================================================

const MORSE_CODE = {
  A: '.-',   B: '-...', C: '-.-.', D: '-..',  E: '.',
  F: '..-.', G: '--.',  H: '....', I: '..',   J: '.---',
  K: '-.-',  L: '.-..', M: '--',   N: '-.',   O: '---',
  P: '.--.', Q: '--.-', R: '.-.',  S: '...',  T: '-',
  U: '..-',  V: '...-', W: '.--',  X: '-..-', Y: '-.--',
  Z: '--..',
  0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-',
  5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.',
  '!': '-.-.--', '/': '-..-.', '(': '-.--.', ')': '-.--.-',
  '&': '.-...', ':': '---...', ';': '-.-.-.', '=': '-...-',
  '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.',
  '$': '...-..-', '@': '.--.-.', ' ': '/',
}

const REVERSE_MORSE = Object.fromEntries(
  Object.entries(MORSE_CODE).map(([k, v]) => [v, k])
)

module.exports = async (ctx) => {
  const { reply, sock, jid, msg, args } = ctx

  if (!args.length) {
    return reply('❌ Provide text to convert!\n_Example: .morse Hello World_\n_Or decode: .morse ... --- ..._')
  }

  const input   = args.join(' ').toUpperCase()
  const isMorse = /^[.\- /]+$/.test(input.trim())

  if (isMorse) {
    try {
      const decoded = input
        .split(' / ')
        .map(word =>
          word.split(' ')
            .map(code => REVERSE_MORSE[code] || '?')
            .join('')
        )
        .join(' ')

      // ── Info card ─────────────────────────────────────────
      await sock.sendMessage(jid, {
        text:
          '📡 *MORSE DECODE*\n' +
          '📥 *Morse:* _' + (input.length > 60 ? input.slice(0, 60) + '...' : input) + '_\n' +
          '',
      }, { quoted: msg })

      // ── Decoded text alone for easy copying ───────────────
      await sock.sendMessage(jid, {
        text: decoded,
      }, { quoted: msg })

    } catch {
      await reply('❌ Invalid morse code!')
    }
    return
  }

  if (input.length > 100) {
    return reply('❌ Text too long! Maximum 100 characters.')
  }

  const unsupported = []
  const morse = input
    .split('')
    .map(char => {
      if (MORSE_CODE[char] !== undefined) return MORSE_CODE[char]
      unsupported.push(char)
      return '?'
    })
    .join(' ')

  // ── Info card ─────────────────────────────────────────────
  await sock.sendMessage(jid, {
    text:
      '📡 *TEXT TO MORSE*\n' +
      '📥 *Text:* _' + input + '_\n' +
      '' + (unsupported.length ? '⚠️ Unsupported chars: *' + [...new Set(unsupported)].join(', ') + '*' : '✅ All characters converted!') + '\n' +
      '',
  }, { quoted: msg })

  // ── Morse alone for easy copying ─────────────────────────
  await sock.sendMessage(jid, {
    text: '`' + morse + '`',
  }, { quoted: msg })
}
