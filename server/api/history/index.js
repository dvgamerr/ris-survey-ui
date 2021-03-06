const logger = require('@touno-io/debuger')('SERVER')
const mssql = require('../../mssql')

module.exports = async (req, res) => {
  let page = parseInt(req.query.p || 1)
  if (isNaN(page)) return res.json([])
  let pool = { close: () => { } }
  try {
    let sql = `
    SELECT * FROM (
      SELECT ROW_NUMBER() OVER (ORDER BY MIN(g.dCreated) DESC) AS nRow
        , t.sTitleName, g.sKey, sName, MIN(g.dCreated) dCreated
        , SUM(CASE WHEN sStatus = 'FAIL' THEN 1 ELSE 0 END) nFail
        , SUM(CASE WHEN sStatus = 'WARN' THEN 1 ELSE 0 END) nWarn
        , SUM(CASE WHEN sStatus = 'INFO' THEN 1 ELSE 0 END) nInfo
        , SUM(CASE WHEN sStatus = 'PASS' THEN 1 ELSE 0 END) nPass
      FROM UserTaskSubmit s
      INNER JOIN (
        SELECT CONVERT(VARCHAR,dCheckIn,112) + REPLACE(CONVERT(VARCHAR,dCheckIn,114), ':', '') sKey, nTaskDetailId, MAX(nIndex) nIndex
        , CONVERT(VARCHAR, MIN(dCreated), 120) dCreated
        , CONVERT(VARCHAR, MAX(dCreated), 120) dModified
        FROM UserTaskSubmit
        GROUP BY CONVERT(VARCHAR,dCheckIn,112) + REPLACE(CONVERT(VARCHAR,dCheckIn,114), ':', ''), nTaskDetailId
      ) g ON g.nIndex = s.nIndex
	  INNER JOIN UserTaskDetail d ON d.nTaskDetailId = s.nTaskDetailId
	  INNER JOIN UserTask t ON t.nTaskId = d.nTaskId
      GROUP BY t.sTitleName, g.sKey, sName
      ) AS r WHERE nRow >= ${page} * 100 - 99 AND nRow <= ${page} * 100
      `
    pool = await mssql()
    let [records] = (await pool.request().query(sql)).recordsets
    return res.json(records)
  } catch (ex) {
    logger.error(ex)
  } finally {
    pool.close()
    res.end()
  }
}
