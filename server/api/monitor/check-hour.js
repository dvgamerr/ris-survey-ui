const logger = require('@touno-io/debuger')('SERVER')
const moment = require('moment')
const lineNone = require('../../line/flex-none')
const LINE = require('../../line')

module.exports = async (req, res) => {
  let pool = { close: () => {} }
  try {
    const hour = parseInt(req.params.hour)
    if (isNaN(hour)) throw new Error('Hour param not int.')
    const command = `
    SELECT COUNT(*) nTask FROM UserTaskSubmit
    WHERE dCheckIn BETWEEN DATEADD(HOUR, -${hour}, GETDATE()) AND GETDATE()
    `
    pool = await sqlConnectionPool(db[config.dev ? 'dev' : 'prd'])
    const [[record]] = (await pool.request().query(command)).recordsets
    if (parseInt(record.nTask) === 0) {
      LINE(
        lineNone(
          `Summary Monitor DailyClose ไม่มีข้อมูลในช่วงเวลา ${moment()
            .add(hour * -1, 'hour')
            .format('HH:mm')} - ${moment().format('HH:mm')}`
        )
      )
    }
  } catch (ex) {
    logger.error(ex)
  } finally {
    pool.close()
    res.end()
  }
}
