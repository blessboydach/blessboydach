// ============================================================
//  VANGUARD MD — commands/genpass.js
// ============================================================

module.exports = async (ctx) => {
  const { reply, sock, jid, msg, args } = ctx

  const length = parseInt(args[0]) || 16

  if (length < 4 || length > 128) {
    return reply('❌ Password length must be between *4* and *128*!\n_Example: .genpass 20_')
  }

  const upper   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lower   = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  const all     = upper + lower + numbers + symbols

  let password =
    upper[Math.floor(Math.random() * upper.length)] +
    lower[Math.floor(Math.random() * lower.length)] +
    numbers[Math.floor(Math.random() * numbers.length)] +
    symbols[Math.floor(Math.random() * symbols.length)]

  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)]
  }

  password = password.split('').sort(() => Math.random() - 0.5).join('')

  let strength = ''
  if (length < 8)       strength = '🔴 Weak'
  else if (length < 12) strength = '🟡 Medium'
  else if (length < 20) strength = '🟢 Strong'
  else                  strength = '🔵 Very Strong'

  // ── Send info card ────────────────────────────────────────
  await sock.sendMessage(jid, {
    text:
      '🔐 *PASSWORD GENERATOR*\n' +
      '📏 *Length:* ' + length + '\n' +
      '💪 *Strength:* ' + strength + '\n' +
      '⚠️ _Save this password somewhere safe!_\n' +
      '',
  }, { quoted: msg })

  // ── Send password alone for easy copying ─────────────────
  await sock.sendMessage(jid, {
    text: '`' + password + '`',
  }, { quoted: msg })
}
