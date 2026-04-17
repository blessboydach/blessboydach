// ============================================================
//  VANGUARD MD — defaults.js
//  Read-only default values — never modified at runtime
// ============================================================

module.exports = {
  // ── Bot Identity ───────────────────────────────────────────
  botName:      'VANGUARD MD',
  prefix:       '.',
  ownerNumber:  '',
  sudoNumbers:  [],

  // ── Mode ──────────────────────────────────────────────────
  mode: 'public',

  // ── Auto Features ─────────────────────────────────────────
  autoRead:         'off',    // off/all/groups/dms
  autoType:         'off',    // off/all/groups/dms
  autoRecord:       'off',    // off/all/groups/dms
  autoRecordType:   'off',    // off/all/groups/dms — random type+record mix
  alwaysOnline:     true,
  autoViewStatus:   true,
  autoReactStatus:  false,
  chatbot:          true,
  anticall:         false,
  autoBio: true,


  // ── Auto React (messages) ─────────────────────────────────
  autoReact:        'off',    // off/all/groups/dms
  autoReactCustom:  [],       // custom emoji pool — overrides library

  // ── Auto Save Status ──────────────────────────────────────
  autoSaveStatus:        'off',  // off/all/contacts/numbers/group
  autoSaveStatusNumbers: [],     // ['256787287967', '256745626308']

  // ── Status Reaction Emojis ─────────────────────────────────
  statusEmojis: ['💙', '💚'],

  // ── Privacy / Anti Features ───────────────────────────────
  antidelete:       true,
  antideleteStatus: true,
  antiedit:         true,

  // ── Group Defaults ─────────────────────────────────────────
  antilink:               false,
  antilinkAction:         'warn',
  antigroupmention:       false,
  antigroupmentionAction: 'warn',
  antisticker:            false,
  antistickerAction:      'warn',
  antimedia:              false,
  antimediaAction:        'warn',
  antibadword:            false,
  antibadwordAction:      'warn',

  // ── Economy ───────────────────────────────────────────────
  startingBalance:  1000,
  dailyReward:      500,
  workMinReward:    100,
  workMaxReward:    800,
  robSuccessChance: 0.45,

  // ── Cooldown ──────────────────────────────────────────────
  cooldownMs: 5000,

  // ── Repo Info ─────────────────────────────────────────────
  repoUrl:  'https://github.com/mradminblue/vanguardmd',
  repoName: 'VANGUARD MD',
  repoDesc: 'A powerful WhatsApp bot built with Baileys',
}
