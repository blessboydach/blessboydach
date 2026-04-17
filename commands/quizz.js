// ============================================================
//  VANGUARD MD — commands/quiz.js
// ============================================================

const { randItem } = require('../lib/utils')

const quizzes = [
  { q: 'What is the capital of Kenya?', options: ['A. Mombasa', 'B. Nairobi', 'C. Kisumu', 'D. Nakuru'], answer: 'B', explanation: 'Nairobi is the capital and largest city of Kenya 🇰🇪' },
  { q: 'How many planets are in our Solar System?', options: ['A. 7', 'B. 9', 'C. 8', 'D. 10'], answer: 'C', explanation: 'There are 8 planets after Pluto was reclassified in 2006 🪐' },
  { q: 'What is the chemical symbol for Water?', options: ['A. WA', 'B. H2O', 'C. HO2', 'D. OW'], answer: 'B', explanation: 'H2O — 2 Hydrogen atoms + 1 Oxygen atom 💧' },
  { q: 'Who painted the Mona Lisa?', options: ['A. Picasso', 'B. Van Gogh', 'C. Da Vinci', 'D. Rembrandt'], answer: 'C', explanation: 'Leonardo da Vinci painted the Mona Lisa around 1503 🎨' },
  { q: 'What is the largest ocean on Earth?', options: ['A. Atlantic', 'B. Indian', 'C. Arctic', 'D. Pacific'], answer: 'D', explanation: 'The Pacific Ocean covers about 165 million km² 🌊' },
  { q: 'How many sides does a hexagon have?', options: ['A. 5', 'B. 6', 'C. 7', 'D. 8'], answer: 'B', explanation: 'Hexa means 6 in Greek 🔷' },
  { q: 'What is the fastest land animal?', options: ['A. Lion', 'B. Horse', 'C. Cheetah', 'D. Leopard'], answer: 'C', explanation: 'Cheetahs can reach speeds of up to 112 km/h! 🐆' },
  { q: 'In which year did World War II end?', options: ['A. 1943', 'B. 1944', 'C. 1945', 'D. 1946'], answer: 'C', explanation: 'World War II ended in 1945 with Allied victory ✌️' },
  { q: 'What is the smallest country in the world?', options: ['A. Monaco', 'B. San Marino', 'C. Vatican City', 'D. Liechtenstein'], answer: 'C', explanation: 'Vatican City covers just 0.44 km² 🇻🇦' },
  { q: 'What is 15% of 200?', options: ['A. 25', 'B. 30', 'C. 35', 'D. 40'], answer: 'B', explanation: '15% × 200 = 30 🔢' },
  { q: 'Which planet is known as the Red Planet?', options: ['A. Venus', 'B. Jupiter', 'C. Mars', 'D. Saturn'], answer: 'C', explanation: 'Mars appears red due to iron oxide on its surface 🔴' },
  { q: 'What language has the most native speakers?', options: ['A. English', 'B. Spanish', 'C. Hindi', 'D. Mandarin'], answer: 'D', explanation: 'Mandarin Chinese has the most native speakers worldwide 🇨🇳' },
  { q: 'What is the hardest natural substance on Earth?', options: ['A. Gold', 'B. Iron', 'C. Diamond', 'D. Quartz'], answer: 'C', explanation: 'Diamond scores 10 on the Mohs hardness scale 💎' },
  { q: 'How many bones are in the adult human body?', options: ['A. 196', 'B. 206', 'C. 216', 'D. 226'], answer: 'B', explanation: 'Adults have 206 bones — babies are born with around 270! 🦴' },
  { q: 'Which continent is the largest by area?', options: ['A. Americas', 'B. Africa', 'C. Asia', 'D. Antarctica'], answer: 'C', explanation: 'Asia covers about 44.6 million km² 🌏' },
]

const activeQuizzes = new Map()

module.exports = async (ctx) => {
  const { reply, jid, args } = ctx

  const answer = args[0]?.toUpperCase()
  if (answer && ['A', 'B', 'C', 'D'].includes(answer)) {
    const active = activeQuizzes.get(jid)
    if (!active) return reply('❌ No active quiz! Start one with *.quiz*')

    const isCorrect = answer === active.answer
    activeQuizzes.delete(jid)

    if (isCorrect) {
      return reply('✅ *Correct Answer!* 🎉\n💡 _' + active.explanation + '_')
    } else {
      return reply('❌ *Wrong!* The correct answer was *' + active.answer + '*\n💡 _' + active.explanation + '_')
    }
  }

  const quiz = randItem(quizzes)
  activeQuizzes.set(jid, quiz)

  await reply(
    '╭───────────────━⊷\n' +
    '┃ 🧠 *QUIZ TIME!*\n' +
    '╰───────────────━⊷\n' +
    '╭───────────────━⊷\n' +
    '┃ ❓ ' + quiz.q + '\n' +
    '┃\n' +
    quiz.options.map(o => '┃ ' + o).join('\n') + '\n' +
    '┃\n' +
    '┃ 💬 Reply with *.quiz A/B/C/D* to answer!\n' +
    '╰───────────────━⊷'
  )
}
