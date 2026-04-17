// ============================================================
//  VANGUARD MD — config.js
//  ★ USER SETTINGS — edit this section to customize your bot
//  Runtime changes (via commands) are saved automatically
// ============================================================

const fs = require('fs')
const path = require('path')
const defaults = require('./defaults')

// ════════════════════════════════════════════════════════════
//  ✏️  USER CONFIGURATION — EDIT HERE
// ════════════════════════════════════════════════════════════

const USER_CONFIG = {
  // ── Bot Identity ──────────────────────────────────────────
  botName:      'VANGUARD MD',
  ownerNumber:  '',
  prefix:       '.',

  // ── Mode ─────────────────────────────────────────────────
  mode:         'public',

  // ── Auto Features ────────────────────────────────────────
  autoRead:         'off',    // off/all/groups/dms
  autoType:         'off',    // off/all/groups/dms
  autoRecord:       'off',    // off/all/groups/dms
  autoRecordType:   'off',    // off/all/groups/dms — random type+record mix
  alwaysOnline:     true,
  autoViewStatus:   true,
  autoReactStatus:  false,
  chatbot:          false,
  anticall:         false,
  autoBio: false,


  // ── Auto React (messages) ────────────────────────────────
  autoReact:        'off',    // off/all/groups/dms
  autoReactCustom:  [],       // custom emoji pool — overrides library

  // ── Auto Save Status ─────────────────────────────────────
  autoSaveStatus:        'off',  // off/all/contacts/numbers/group
  autoSaveStatusNumbers: [],     // specific numbers to save from

  // ── Status Reaction Emojis ────────────────────────────────
  statusEmojis: ['💙', '💚', '🔥', '😂', '❤️'],

  // ── Privacy Features ─────────────────────────────────────
  antidelete:       false,
  antideleteStatus: false,
  antiedit:         false,

  // ── Repo Info ─────────────────────────────────────────────
  repoUrl:  'https://github.com/mradminblue/vanguardmd',
  repoName: 'vanguardmd',
  repoDesc: 'A powerful WhatsApp bot',
}

// ════════════════════════════════════════════════════════════
//  ⚙️  PERSISTENCE ENGINE — DO NOT EDIT BELOW THIS LINE
// ════════════════════════════════════════════════════════════

const CONFIG_FILE = path.join(__dirname, 'data', 'config.json')

const loadConfig = () => {
  let saved = {}
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      saved = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'))
    }
  } catch (err) {
    console.error('⚠️  Failed to load config.json, using defaults:', err.message)
  }

  return {
    // ── Bot Identity ────────────────────────────────────────
    botName:      saved.botName      ?? USER_CONFIG.botName      ?? defaults.botName,
    prefix:       saved.prefix       ?? USER_CONFIG.prefix       ?? defaults.prefix,
    ownerNumber:  saved.ownerNumber  ?? USER_CONFIG.ownerNumber  ?? defaults.ownerNumber,
    sudoNumbers:  saved.sudoNumbers  ?? USER_CONFIG.sudoNumbers  ?? [...defaults.sudoNumbers],

    // ── Mode ────────────────────────────────────────────────
    mode: saved.mode ?? USER_CONFIG.mode ?? defaults.mode,

    // ── Auto Features ───────────────────────────────────────
    autoRead:         saved.autoRead         ?? USER_CONFIG.autoRead         ?? defaults.autoRead,
    autoType:         saved.autoType         ?? USER_CONFIG.autoType         ?? defaults.autoType,
    autoRecord:       saved.autoRecord       ?? USER_CONFIG.autoRecord       ?? defaults.autoRecord,
    autoRecordType:   saved.autoRecordType   ?? USER_CONFIG.autoRecordType   ?? defaults.autoRecordType,
    alwaysOnline:     saved.alwaysOnline     ?? USER_CONFIG.alwaysOnline     ?? defaults.alwaysOnline,
    autoViewStatus:   saved.autoViewStatus   ?? USER_CONFIG.autoViewStatus   ?? defaults.autoViewStatus,
    autoReactStatus:  saved.autoReactStatus  ?? USER_CONFIG.autoReactStatus  ?? defaults.autoReactStatus,
    chatbot:          saved.chatbot          ?? USER_CONFIG.chatbot          ?? defaults.chatbot,
    anticall:         saved.anticall         ?? USER_CONFIG.anticall         ?? defaults.anticall,

    // ── Auto React (messages) ────────────────────────────────
    autoReact:        saved.autoReact        ?? USER_CONFIG.autoReact        ?? defaults.autoReact,
    autoReactCustom:  saved.autoReactCustom  ?? USER_CONFIG.autoReactCustom  ?? [...defaults.autoReactCustom],

    // ── Auto Save Status ─────────────────────────────────────
    autoSaveStatus:        saved.autoSaveStatus        ?? USER_CONFIG.autoSaveStatus        ?? defaults.autoSaveStatus,
    autoSaveStatusNumbers: saved.autoSaveStatusNumbers ?? USER_CONFIG.autoSaveStatusNumbers ?? [...defaults.autoSaveStatusNumbers],

    // ── Status Reaction Emojis ───────────────────────────────
    statusEmojis: saved.statusEmojis ?? USER_CONFIG.statusEmojis ?? [...defaults.statusEmojis],

    // ── Privacy / Anti Features ──────────────────────────────
    antidelete:       saved.antidelete       ?? USER_CONFIG.antidelete       ?? defaults.antidelete,
    antideleteStatus: saved.antideleteStatus ?? USER_CONFIG.antideleteStatus ?? defaults.antideleteStatus,
    antiedit:         saved.antiedit         ?? USER_CONFIG.antiedit         ?? defaults.antiedit,
      autoBio: saved.autoBio ?? USER_CONFIG.autoBio ?? defaults.autoBio,


    // ── Group Defaults ───────────────────────────────────────
    antilink:               saved.antilink               ?? USER_CONFIG.antilink               ?? defaults.antilink,
    antilinkAction:         saved.antilinkAction         ?? USER_CONFIG.antilinkAction         ?? defaults.antilinkAction,
    antigroupmention:       saved.antigroupmention       ?? USER_CONFIG.antigroupmention       ?? defaults.antigroupmention,
    antigroupmentionAction: saved.antigroupmentionAction ?? USER_CONFIG.antigroupmentionAction ?? defaults.antigroupmentionAction,
    antisticker:            saved.antisticker            ?? USER_CONFIG.antisticker            ?? defaults.antisticker,
    antistickerAction:      saved.antistickerAction      ?? USER_CONFIG.antistickerAction      ?? defaults.antistickerAction,
    antimedia:              saved.antimedia              ?? USER_CONFIG.antimedia              ?? defaults.antimedia,
    antimediaAction:        saved.antimediaAction        ?? USER_CONFIG.antimediaAction        ?? defaults.antimediaAction,
    antibadword:            saved.antibadword            ?? USER_CONFIG.antibadword            ?? defaults.antibadword,
    antibadwordAction:      saved.antibadwordAction      ?? USER_CONFIG.antibadwordAction      ?? defaults.antibadwordAction,

    // ── Economy ──────────────────────────────────────────────
    startingBalance:  saved.startingBalance  ?? USER_CONFIG.startingBalance  ?? defaults.startingBalance,
    dailyReward:      saved.dailyReward      ?? USER_CONFIG.dailyReward      ?? defaults.dailyReward,
    workMinReward:    saved.workMinReward    ?? USER_CONFIG.workMinReward    ?? defaults.workMinReward,
    workMaxReward:    saved.workMaxReward    ?? USER_CONFIG.workMaxReward    ?? defaults.workMaxReward,
    robSuccessChance: saved.robSuccessChance ?? USER_CONFIG.robSuccessChance ?? defaults.robSuccessChance,

    // ── Repo Info ────────────────────────────────────────────
    repoUrl:  saved.repoUrl  ?? USER_CONFIG.repoUrl  ?? defaults.repoUrl,
    repoName: saved.repoName ?? USER_CONFIG.repoName ?? defaults.repoName,
    repoDesc: saved.repoDesc ?? USER_CONFIG.repoDesc ?? defaults.repoDesc,
  }
}

const saveConfig = () => {
  try {
    const dir = path.dirname(CONFIG_FILE)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
  } catch (err) {
    console.error('⚠️  Failed to save config.json:', err.message)
  }
}

const raw = loadConfig()

const config = new Proxy(raw, {
  set(target, key, value) {
    target[key] = value
    saveConfig()
    return true
  }
})

module.exports = config
