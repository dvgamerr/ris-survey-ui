const logger = require('@debuger')('SERVER')
const mssql = require('@mssql')

module.exports = async (req, res) => {
  let { id } = req.params
  let pool = { close: () => {} }
  try {
    pool = await mssql()
    let sql = `select sTitleName, sMenu FROM UserTask WHERE nIndex = ${id}`
    let [ task ] = (await pool.request().query(sql)).recordset
    
    sql = `SELECT nTaskId, sTitleName, nIndex = ${id}
      , dCreated FROM UserTask ORDER BY nTaskId ASC`
    let [ records ] = (await pool.request().query(sql)).recordsets
    res.json({ tasks: records })
  } catch (ex) {
    logger.error(ex)
  } finally {
    pool.close()
    res.end()
  }
}
