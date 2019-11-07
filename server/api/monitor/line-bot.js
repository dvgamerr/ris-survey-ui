const logger = require('@touno-io/debuger')('SERVER')
const request = require('request-promise')
const lineUsage = require('../../line/flex-line-usage')
const LINE = require('@line')

module.exports = async (req, res) => {
  try {
    let data = await request('http://s-thcw-posweb01.pos.cmg.co.th:3000/stats', { json: true })
    await LINE(lineUsage(data), 'ris-sd3', 'C31ca657c0955d89dcb049d63bfc32408')
  } catch (ex) {
    logger.error(ex)
  } finally {
    res.end()
  }
}
