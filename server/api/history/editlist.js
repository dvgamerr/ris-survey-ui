const logger = require('@touno-io/debuger')('SERVER')
const mssql = require('@mssql')

module.exports = async (req, res) => {
  let { id } = req.params
  let pool = { close: () => { } }
  try {
    
    pool = await mssql()
    let command1 = `SELECT [sTitleName], [sMenu], CONVERT(VARCHAR,dCreated,120)dCreated FROM [dbo].[UserTask] WHERE nTaskId = '${id}'
          `
    let [tittleName] = (await pool.request().query(command1)).recordset

    command2 = `SELECT nTaskDetailId, sSubject, ISNULL(sDetail,'') sDetail, sDescription, sSolve, nOrder
    FROM UserTaskDetail d
    INNER JOIN UserTask t ON t.nTaskId = d.nTaskId
    WHERE d.bEnabled = 1 AND t.nTaskId = ${id} ORDER BY nOrder ASC`
    let [records] = (await pool.request().query(command2)).recordsets

    res.json({ titleName: tittleName['sTitleName'],dCreated: tittleName['dCreated'], tasks: records}) 
  } catch (ex) {
    logger.error(ex)
  } finally {
    pool.close()
    res.end()
  }
}

