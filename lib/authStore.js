// ============================================================
//  VANGUARD MD  – lib/authStore.js
//  Multi-format JID storage – global + scoped sudo/ban
// ============================================================

const fs   = require('fs')
const path = require('path')

const DATA_DIR    = path.join(__dirname, '..', 'data')
const SUDO_FILE   = path.join(DATA_DIR, 'sudo.json')
const GSUDO_FILE  = path.join(DATA_DIR, 'gsudo.json')
const DMSUDO_FILE = path.join(DATA_DIR, 'dmsudo.json')
const BANNED_FILE = path.join(DATA_DIR, 'banned.json')
const GBAN_FILE   = path.join(DATA_DIR, 'gban.json')
const DMBAN_FILE  = path.join(DATA_DIR, 'dmban.json')

const ensureDir = () => {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

// ── Internal helpers ──────────────────────────────────────────
const _strip = (jid) => {
    if (!jid) return ''
    return jid.replace(/:[0-9]+@/, '@')
}

const _num = (jid) => {
    if (!jid) return ''
    return jid.replace(/:[0-9]+/, '').replace(/@.+/, '')
}

// ── Load – migrates old plain-string arrays automatically ────
const _load = (file) => {
    try {
        if (!fs.existsSync(file)) return []
        const raw = JSON.parse(fs.readFileSync(file, 'utf8'))
        if (!Array.isArray(raw)) return []
        return raw.map(function(entry) {
            if (typeof entry === 'string') {
                return { num: entry.trim(), aliases: [entry.trim() + '@s.whatsapp.net'] }
            }
            return {
                num:     (entry.num || '').trim(),
                aliases: Array.isArray(entry.aliases) ? entry.aliases : [],
            }
        }).filter(function(e) { return e.num.length >= 7 })
    } catch (e) { return [] }
}

const _save = (file, entries) => {
    try {
        ensureDir()
        fs.writeFileSync(file, JSON.stringify(entries, null, 2))
        return true
    } catch (e) { return false }
}

// ── Core matcher ──────────────────────────────────────────────
const _matches = (entry, rawJid) => {
    if (!rawJid || !entry.num) return false
    const inNum      = _num(rawJid)
    const inStripped = _strip(rawJid)
    if (inNum && inNum === entry.num) return true
    if (rawJid === entry.num) return true
    if (entry.aliases) {
        for (var i = 0; i < entry.aliases.length; i++) {
            var a = entry.aliases[i]
            if (
                a === rawJid          ||
                a === inStripped      ||
                _strip(a) === inStripped ||
                _num(a) === inNum
            ) return true
        }
    }
    return false
}

const _hasAlias = (entry, jid) => {
    const stripped = _strip(jid)
    return entry.aliases.some(function(a) {
        return a === jid || a === stripped || _strip(a) === stripped
    })
}

// ── Generic store factory ─────────────────────────────────────
const _makeStore = (file) => ({
    getEntries: function() { return _load(file) },
    getList:    function() { return _load(file).map(function(e) { return e.num }) },
    match: function(rawJid) {
        return _load(file).some(function(e) { return _matches(e, rawJid) })
    },
    add: function(num) {
        const entries = _load(file)
        if (entries.some(function(e) { return e.num === num })) return false
        entries.push({ num: num, aliases: [num + '@s.whatsapp.net'] })
        return _save(file, entries)
    },
    rem: function(num) {
        const entries = _load(file)
        const next    = entries.filter(function(e) { return e.num !== num })
        if (next.length === entries.length) return false
        return _save(file, next)
    },
    clear:    function() { return _save(file, []) },
    saveList: function(list) {
        return _save(file, list.map(function(num) {
            return { num: num, aliases: [num + '@s.whatsapp.net'] }
        }))
    },
    addAlias: function(num, rawJid) {
        const stripped = _strip(rawJid)
        if (!stripped || stripped === num + '@s.whatsapp.net') return false
        const entries = _load(file)
        const entry   = entries.find(function(e) { return e.num === num })
        if (!entry) return false
        if (_hasAlias(entry, stripped)) return false
        entry.aliases.push(stripped)
        return _save(file, entries)
    },
})

// ── Create all six stores ─────────────────────────────────────
const sudoStore   = _makeStore(SUDO_FILE)
const gsudoStore  = _makeStore(GSUDO_FILE)
const dmsudoStore = _makeStore(DMSUDO_FILE)
const bannedStore = _makeStore(BANNED_FILE)
const gbanStore   = _makeStore(GBAN_FILE)
const dmbanStore  = _makeStore(DMBAN_FILE)

// ── Exports ───────────────────────────────────────────────────
module.exports = {
    // Global sudo
    getSudoList:      function() { return sudoStore.getList() },
    getSudoEntries:   function() { return sudoStore.getEntries() },
    matchSudo:        function(jid) { return sudoStore.match(jid) },
    addSudo:          function(num) { return sudoStore.add(num) },
    remSudo:          function(num) { return sudoStore.rem(num) },
    clearSudo:        function() { return sudoStore.clear() },
    saveSudoList:     function(list) { return sudoStore.saveList(list) },
    addSudoAlias:     function(num, jid) { return sudoStore.addAlias(num, jid) },

    // Group sudo
    getGSudoList:     function() { return gsudoStore.getList() },
    getGSudoEntries:  function() { return gsudoStore.getEntries() },
    matchGSudo:       function(jid) { return gsudoStore.match(jid) },
    addGSudo:         function(num) { return gsudoStore.add(num) },
    remGSudo:         function(num) { return gsudoStore.rem(num) },
    clearGSudo:       function() { return gsudoStore.clear() },
    addGSudoAlias:    function(num, jid) { return gsudoStore.addAlias(num, jid) },

    // DM sudo
    getDMSudoList:    function() { return dmsudoStore.getList() },
    getDMSudoEntries: function() { return dmsudoStore.getEntries() },
    matchDMSudo:      function(jid) { return dmsudoStore.match(jid) },
    addDMSudo:        function(num) { return dmsudoStore.add(num) },
    remDMSudo:        function(num) { return dmsudoStore.rem(num) },
    clearDMSudo:      function() { return dmsudoStore.clear() },
    addDMSudoAlias:   function(num, jid) { return dmsudoStore.addAlias(num, jid) },

    // Global ban
    getBannedList:    function() { return bannedStore.getList() },
    getBannedEntries: function() { return bannedStore.getEntries() },
    matchBanned:      function(jid) { return bannedStore.match(jid) },
    addBan:           function(num) { return bannedStore.add(num) },
    remBan:           function(num) { return bannedStore.rem(num) },
    clearBan:         function() { return bannedStore.clear() },
    saveBannedList:   function(list) { return bannedStore.saveList(list) },
    addBanAlias:      function(num, jid) { return bannedStore.addAlias(num, jid) },

    // Group ban
    getGBanList:      function() { return gbanStore.getList() },
    matchGBan:        function(jid) { return gbanStore.match(jid) },
    addGBan:          function(num) { return gbanStore.add(num) },
    remGBan:          function(num) { return gbanStore.rem(num) },
    clearGBan:        function() { return gbanStore.clear() },

    // DM ban
    getDMBanList:     function() { return dmbanStore.getList() },
    matchDMBan:       function(jid) { return dmbanStore.match(jid) },
    addDMBan:         function(num) { return dmbanStore.add(num) },
    remDMBan:         function(num) { return dmbanStore.rem(num) },
    clearDMBan:       function() { return dmbanStore.clear() },
}