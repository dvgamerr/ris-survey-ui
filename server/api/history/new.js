const logger = require('@debuger')('SERVER')
const mssql = require('@mssql')
const moment = require('moment')

module.exports = async (req, res) => {
  let pool = { close: () => { } }
  try {
    let { tasks, titleName } = req.body
    let created = moment() // 2019-03-01 18:04:09.503
    pool = await mssql()

    let checkTitle = `SELECT [sTitleName] from UserTask where [sTitleName] LIKE '%${titleName}%'`
    let [recordTitle] = (await pool.request().query(checkTitle)).recordsets
    if (recordTitle.length > 0) throw new Error("This Title is use already!")  

    let command1 = `INSERT INTO [dbo].[UserTask]
             ([nTaskId],[sTitleName],[nLevelPermission],[bEnabled],[dCreated])
          VALUES
             ((SELECT MAX([nTaskId]) + 1 FROM [dbo].[UserTask]),'${titleName}',0,1,CONVERT(DATETIME, '${created.format('YYYY-MM-DD HH:mm:ss.SSS')}', 121))
          `
    await pool.request().query(command1)
    let updateTrimTitle =`UPDATE [dbo].[Usertask] set [sTitleName] = LTRIM(RTRIM('${titleName}')) WHERE [nTaskId] = (SELECT MAX([nTaskId]) FROM [dbo].[UserTask])`
    await pool.request().query(updateTrimTitle)
    let i = 0
    for (const e of tasks) {
      i += 1
      let command2 = `INSERT INTO [dbo].[UserTaskdetail] ([nTaskDetailId],[nTaskId],[sSubject],[nOrder],[bEnabled],[dCreated])
      VALUES ((SELECT MAX([nTaskDetailID]) + 1 FROM [dbo].[UserTaskDetail]),((SELECT MAX([nTaskId]) FROM [dbo].[UserTask])),
      '${e.sSubject}','${i}','True', CONVERT(DATETIME, '${created.format('YYYY-MM-DD HH:mm:ss.SSS')}', 121))
    `
      await pool.request().query(command2)
    }
    res.json({ success: true })
  } catch (ex) {
    logger.error(ex)
    res.json({ success: false, error: ex.message })
  } finally {
    pool.close()
    res.end()
  }
}
