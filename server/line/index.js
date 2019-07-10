const logger = require('@debuger')('LINE')
const request = require('request-promise')
// Import and Set Nuxt.js options
const LINE_API = process.env.LINE_API || 'Cbdf461dd7136e1e7b570d0cb6a2ef9f5'
module.exports = async (body, bot = 'survey', userId) => {
  await request({ method: 'PUT', url: `http://10.101.147.48:3000/${bot}/${userId || LINE_API}`, body, json: true })
  let text = body.type === 'flex' ? body.altText : ''
  logger.info(`Push ${bot} FlexMessage '${text}'.`)
}
