// ============================================================
//  VANGUARD MD — commands/sentence.js
//  Raw String Generator
// ============================================================

const fs = require('fs').promises;
const path = require('path');

module.exports = async (ctx) => {
  const { reply, isOwner, isSudo } = ctx;

  if (!isOwner && !isSudo) return; // Silent drop for non-owners

  try {
    const cmdFolder = path.join(process.cwd(), 'commands');
    const files = await fs.readdir(cmdFolder);
    
    // Filter for .js files only
    const jsFiles = files.filter(f => f.endsWith('.js'));

    // ── LOGIC 1: Alphabetical Order ──────────────
    const alphaList = [...jsFiles]
      .map(f => f.replace('.js', ''))
      .sort((a, b) => a.localeCompare(b))
      .join(', ');

    // ── LOGIC 2: Last Modified to First ──────────
    const fileStats = await Promise.all(
      jsFiles.map(async (file) => {
        const stats = await fs.stat(path.join(cmdFolder, file));
        return { name: file.replace('.js', ''), mtime: stats.mtime.getTime() };
      })
    );

    const recentList = fileStats
      .sort((a, b) => b.mtime - a.mtime) // Newest files first
      .map(f => f.name)
      .join(', ');

    // ── RAW OUTPUT ───────────────────────────────
    const output = `Alphabetical order\n${alphaList}\nLatest\n${recentList}`;

    await reply(output);

  } catch (error) {
    console.error('Sentence Error:', error);
    await reply(`Error: ${error.message}`);
  }
};
