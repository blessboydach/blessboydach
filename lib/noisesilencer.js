// ============================================================
//  VANGUARD MD — lib/noisesilencer.js
//  Swallows crypto noise at the stream level
//  REQUIRED AT THE VERY TOP OF index.js (before Baileys)
// ============================================================

const CRYPTO_PATTERNS = [
  /chainKey\s*:/,
  /ephemeralKeyPair\s*:/,
  /pubKey\s*:\s*<Buffer/,
  /privKey\s*:\s*<Buffer/,
  /rootKey\s*:\s*<Buffer/,
  /baseKey\s*:\s*<Buffer/,
  /lastRemoteEphemeralKey\s*:/,
  /registrationId\s*:/,
  /currentRatchet\s*:/,
  /indexInfo\s*:/,
  /previousCounter\s*:/,
  /remoteIdentityKey\s*:/,
  /baseKeyType\s*:/,
  /<Buffer\s+[0-9a-f\s]{20,}>/,  // Hex buffer dumps
  /messageKeys\s*:/,
  /used\s*:\s*\d{10,}/,          // Timestamp-looking "used" fields
  /created\s*:\s*\d{10,}/        // Timestamp-looking "created" fields
]

const isCryptoNoise = (chunk) => {
  if (!chunk) return false
  const str = chunk.toString()
  // If it looks like a Signal key object structure, kill it
  return CRYPTO_PATTERNS.some(pattern => pattern.test(str))
}

// Patch stdout
const originalStdoutWrite = process.stdout.write.bind(process.stdout)
process.stdout.write = function(chunk, encoding, callback) {
  if (isCryptoNoise(chunk)) {
    // Swallowed - return true to indicate "success"
    if (typeof encoding === 'function') {
      encoding()
    } else if (typeof callback === 'function') {
      callback()
    }
    return true
  }
  return originalStdoutWrite.call(process.stdout, chunk, encoding, callback)
}

// Patch stderr  
const originalStderrWrite = process.stderr.write.bind(process.stderr)
process.stderr.write = function(chunk, encoding, callback) {
  if (isCryptoNoise(chunk)) {
    // Swallowed
    if (typeof encoding === 'function') {
      encoding()
    } else if (typeof callback === 'function') {
      callback()
    }
    return true
  }
  return originalStderrWrite.call(process.stderr, chunk, encoding, callback)
}

// Also poison console methods as backup
const originalConsoleLog = console.log
const originalConsoleError = console.error
const originalConsoleWarn = console.warn

const sanitizeArgs = (args) => {
  return args.map(arg => {
    if (arg && typeof arg === 'object') {
      try {
        const str = JSON.stringify(arg)
        if (str.includes('chainKey') || str.includes('ephemeralKeyPair') || str.includes('pubKey')) {
          return '[Object]'
        }
      } catch (e) {
        return '[Circular]'
      }
    }
    return arg
  })
}

console.log = (...args) => originalConsoleLog.apply(console, sanitizeArgs(args))
console.error = (...args) => originalConsoleError.apply(console, sanitizeArgs(args))
console.warn = (...args) => originalConsoleWarn.apply(console, sanitizeArgs(args))

module.exports = { active: true }
console.log('🔇 Noise silencer activated')
