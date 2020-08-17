const logger = require('@touno-io/debuger')('SERVER')
const mssql = require('../../mssql')

module.exports = async (req, res) => {
  let page = parseInt(req.query.p || 1)
  if (isNaN(page)) return res.json([])
  let pool = { close: () => {} }
  try {
    let sql = `SELECT * FROM (	
      SELECT ROW_NUMBER() OVER (ORDER BY nType ASC, dCreated DESC) AS nRow, 
		nType, nTaskId, sTitleName, bEnabled, sCreated FROM 
		(
			SELECT 1 nType, s.nTaskId, s.sTitleName, s.bEnabled, CONVERT(VARCHAR,s.dCreated,120)sCreated,(s.dCreated)dCreated FROM UserTask s
			INNER JOIN UserTaskDetail d ON d.nTaskId = s.nTaskId
			LEFT JOIN UserTaskSubmit t ON t.nTaskDetailId = d.nTaskDetailId
			WHERE s.bEnabled = 1 and d.bEnabled = 1  and t.nTaskDetailId IS NULL
			GROUP BY s.nTaskId, s.sTitleName, s.bEnabled, s.dCreated 
			UNION ALL
			SELECT 2 nType, s.nTaskId, s.sTitleName, s.bEnabled, CONVERT(VARCHAR,MAX(t.dCreated),120)sCreated, (MAX(t.dCreated))dCreated FROM UserTask s
			INNER JOIN UserTaskDetail d ON d.nTaskId = s.nTaskId
			INNER JOIN UserTaskSubmit t ON t.nTaskDetailId = d.nTaskDetailId
			WHERE s.bEnabled = 1 and d.bEnabled = 1
			GROUP BY s.nTaskId, s.sTitleName, s.bEnabled, s.dCreated
      ) a
    ) AS r WHERE nRow >= ${page} * 100 - 99 AND nRow <= ${page} * 100
    `
      
    pool = await mssql()
    let [ records ] = (await pool.request().query(sql)).recordsets
    res.json(records)
  } catch (ex) {
    logger.error(ex)
  } finally {
    pool.close()
    res.end()
  }
}