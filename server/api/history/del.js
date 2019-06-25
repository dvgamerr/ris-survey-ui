const logger = require('@debuger')('SERVER')
const mssql = require('@mssql')
const moment = require('moment')

module.exports = async (req, res) => {
  let pool = { close: () => { } }
  try {
    let key = parseInt(req.params.id)
    if (isNaN(key)) return res.json({})
    
    logger.info('TiTle ID:', req.params.id, 'Del.')

    pool = await mssql()
    let del = `UPDATE [dbo].[UserTask] SET [bEnabled] = 0 WHERE [nTaskId] = ${key}`
    await pool.request().query(del)
    res.json({ success: true })
  } catch (ex) {
    logger.error(ex)
    res.json({ success: false, error: ex.message })
  } finally {
    pool.close()
    res.end()
  }
}
