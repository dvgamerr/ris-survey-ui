const logger = require('@touno-io/debuger')('SERVER')
const moment = require('moment')
const mssql = require('../../mssql')

module.exports = async (req, res) => {
  const key = parseInt(req.params.id)
  if (isNaN(key)) return res.json({})
  let pool = { close: () => {} }
  logger.info('History ID:', req.params.id, 'Deleted.')
  const dCheckIn = moment(req.params.id, 'YYYYMMDDHHmmssSSS')
  if (!moment.isMoment(dCheckIn)) return res.json({})
  try {
    const sql = `DELETE FROM UserTaskSubmit WHERE dCheckIn = CONVERT(DATETIME, '${dCheckIn.format(
      'YYYY-MM-DD HH:mm:ss.SSS'
    )}')`
    pool = await mssql()
    await pool.request().query(sql)
    return res.json({})
  } catch (ex) {
    logger.error(ex)
  } finally {
    pool.close()
    res.end()
  }
}
