// ============================================================
//  VANGUARD MD — lib/uploader.js
//  TelegraPh (images) + Uguu (all files)
// ============================================================

const axios    = require('axios')
const FormData = require('form-data')
const fs       = require('fs')

const TelegraPh = (filePath) => {
  return new Promise(async (resolve, reject) => {
    if (!fs.existsSync(filePath)) return reject(new Error('File not found'))
    try {
      const form = new FormData()
      form.append('file', fs.createReadStream(filePath))
      const { data } = await axios({
        url:     'https://telegra.ph/upload',
        method:  'POST',
        headers: form.getHeaders(),
        data:    form,
      })
      resolve('https://telegra.ph' + data[0].src)
    } catch (err) {
      reject(new Error(String(err)))
    }
  })
}

const UploadFileUgu = (filePath) => {
  return new Promise(async (resolve, reject) => {
    try {
      const form = new FormData()
      form.append('files[]', fs.createReadStream(filePath))
      const { data } = await axios({
        url:     'https://uguu.se/upload.php',
        method:  'POST',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ...form.getHeaders(),
        },
        data: form,
      })
      resolve(data.files[0])
    } catch (err) {
      reject(err)
    }
  })
}

module.exports = { TelegraPh, UploadFileUgu }
