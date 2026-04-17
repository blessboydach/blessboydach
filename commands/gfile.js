// ============================================================
//  VANGUARD MD — commands/gfile.js
//  Universal File Extractor (owner and sudo)
// ============================================================

const fs = require('fs').promises;
const path = require('path');

/**
 * Deep Scan Engine: Recursively searches for a filename
 * Optimized for speed by bypassing heavy directories.
 */
async function findFileRecursively(dir, targetFile) {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Bypass non-essential "Black Hole" directories
      if (['node_modules', '.git', 'temp', '.npm'].includes(entry.name)) continue;
      
      const found = await findFileRecursively(fullPath, targetFile);
      if (found) return found;
    } else if (entry.name.toLowerCase() === targetFile.toLowerCase()) {
      return fullPath;
    }
  }
  return null;
}

module.exports = async (ctx) => {
  const { sock, jid, msg, args, isOwner, isSudo, reply, prefix, command } = ctx;

  // 1. Security Protocol
  if (!isOwner && !isSudo) return reply('❌ *Access Denied:* Unauthorized File Access.');

  const target = args[0]?.trim();

  if (!target) {
    return reply(`*📂 VANGUARD FILE EXTRACTOR*\nUsage: \`${prefix}${command} <filename>\`\nExample: \`${prefix}${command} config.json\``);
  }

  await reply(`⚡ *Locating and extracting* \`${target}\`...`);

  try {
    const startTime = Date.now();
    const filePath = await findFileRecursively(process.cwd(), target);
    const endTime = Date.now();

    if (!filePath) {
      return reply(`❌ *Search Failed:* File \`${target}\` not found!.`);
    }

  const stats = await fs.stat(filePath);
    const fileSizeKB = (stats.size / 1024).toFixed(2);
    const scanTime = (endTime - startTime) / 1000;
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Determine MimeType (Simplified)
    const ext = path.extname(filePath).toLowerCase();
    let mimetype = 'application/octet-stream';
    if (ext === '.js') mimetype = 'application/javascript';
    if (ext === '.json') mimetype = 'application/json';
    if (ext === '.txt') mimetype = 'text/plain';

    // 2. The Report (Caption)
    const report = 
      `\n` +
      `🚀 *VANGUARD FILE DISPATCH*\n` +
      `\n` +
      `📍 *Path:* ${relativePath}\n` +
      `⚡ *Scan:* ${scanTime}s\n` +
      `📊 *Size:* ${fileSizeKB} KB\n` +
      `\n` +
      `> _Source: Vanguard MD Core_`;

    // 3. Send as Real Document
    await sock.sendMessage(jid, {
      document: { url: filePath },
      fileName: path.basename(filePath),
      mimetype: mimetype,
      caption: report
    }, { quoted: msg });

  } catch (error) {
    console.error('GFile Error:', error);
    await reply(`❌ *Extraction Error:* ${error.message}`);
  }
};
