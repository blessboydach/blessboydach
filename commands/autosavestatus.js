// ============================================================
//  VANGUARD MD — commands/autosavestatus.js
// ============================================================

const config   = require('../config')
const defaults = require('../defaults')

module.exports = async (ctx) => {
  const { reply, args, isSudo } = ctx
  if (!isSudo) return reply('❌ Only sudo/owner can use this command!')

  const state = args[0]?.toLowerCase()

  if (!state) {
    const current = config.autoSaveStatus ?? defaults.autoSaveStatus ?? 'off'
    const numbers = config.autoSaveStatusNumbers ?? []
    return reply(
      '📸 *AUTO SAVE STATUS*\n' +
      '📍 *Current:* ' + current.toUpperCase() + '\n' +
      (numbers.length ? '📱 *Numbers:* ' + numbers.join(', ') + '\n' : '') +
      '*Usage:*\n' +
      '.autosavestatus off\n' +
      '.autosavestatus all\n' +
      '.autosavestatus contacts\n' +
      '.autosavestatus group\n' +
      '.autosavestatus 256787287967\n' +
      '.autosavestatus 256787...,256745...\n' +
      ''
    )
  }

  // ── Specific numbers ──────────────────────────────────────
  if (/^[0-9,]+$/.test(state)) {
    const numbers = state.split(',').map(n => n.replace(/[^0-9]/g, '').trim()).filter(Boolean)
    config.autoSaveStatus        = 'numbers'
    config.autoSaveStatusNumbers = numbers
    return reply(
      '📸 *AUTO SAVE STATUS*\n' +
      '✅ *Mode:* NUMBERS\n' +
      '📱 *Tracking:* ' + numbers.join(', ') + '\n' +
      '_Statuses forwarded to owner inbox_\n' +
      ''
    )
  }

  // ── Mode switch ───────────────────────────────────────────
  const validModes = ['off', 'all', 'contacts', 'group']
  if (!validModes.includes(state)) {
    return reply('❌ Invalid mode! Use: off / all / contacts / group / <number>')
  }

  config.autoSaveStatus        = state
  config.autoSaveStatusNumbers = []

  const labels = {
    off:      '❌ *OFF* — No statuses saved',
    all:      '✅ *ALL* — Every status forwarded to owner',
    contacts: '✅ *CONTACTS* — Only saved contacts forwarded',
    group:    '✅ *GROUP* — Only group mentions forwarded',
  }

  await reply(
    '📸 *AUTO SAVE STATUS*\n' +
    '' + labels[state] + '\n' +
    '_Statuses forwarded to owner inbox_\n' +
    ''
  )
}
