const logger = require('@debuger')('SERVER')
const mssql = require('@mssql')
const moment = require('moment')

module.exports = async (req, res) => {
  let pool = { close: () => { } }
  try {
    let { tasks, titleName } = req.body
    let created = moment() // 2019-03-01 18:04:09.503
    let updated = []
    pool = await mssql()

    let checkTitle = `SELECT [sTitleName] from UserTask`
    let [recordTitle] = (await pool.request().query(checkTitle)).recordsets
    let j = -1
    for (const a of recordTitle) {
      j += 1
      if (recordTitle[j].sTitleName == titleName) return
      updated.push(a)
    }

    let checkRow = `SELECT max(nTaskID) n from UserTask`
    let [[record]] = (await pool.request().query(checkRow)).recordsets
    nTaskId = record.n + 1

    let command1 = `INSERT INTO [dbo].[UserTask]
             ([nTaskId],[sTitleName],[nLevelPermission],[bEnabled],[dCreated])
          VALUES
             ('${nTaskId}','${titleName}',0,1,CONVERT(DATETIME, '${created.format('YYYY-MM-DD HH:mm:ss.SSS')}', 121))
          `
    await pool.request().query(command1)
    let checkTaskDetail = `SELECT max(nTaskDetailID) n from UserTaskDetail`
    let [[newrecord]] = (await pool.request().query(checkTaskDetail)).recordsets
    checkTaskDetail = newrecord.n + 1
    let i = 0
    for (const e of tasks) {
      i += 1
      checkTaskDetail += 1

      let command2 = `INSERT INTO [dbo].[UserTaskdetail] ([nTaskDetailId],[nTaskId],[sSubject],[nOrder],[bEnabled],[dCreated])
      VALUES ('${checkTaskDetail}','${nTaskId}','${e.sSubject}','${i}','True', CONVERT(DATETIME, '${created.format('YYYY-MM-DD HH:mm:ss.SSS')}', 121))
    `
      await pool.request().query(command2)
      updated.push(e)
    }
    res.json({ success: true })
  } catch (ex) {
    logger.error(ex)
    res.json({ success: false })
  } finally {
    pool.close()
    res.end()
  }
}
