const logger = require('@debuger')('SERVER')
const mssql = require('@mssql')
const moment = require('moment')

module.exports = async (req, res) => {
  let pool = { close: () => { } }
  try {
    let { tasks, titleName, key } = req.body
    let created = moment() // 2019-03-01 18:04:09.503
    pool = await mssql()

// insert
    if (!key) {
      if (titleName.trim() == "") throw new Error("Don't use space !")
      titleName = titleName.replace(/\s+/g," ")
      titleName = titleName.replace(/'/g, "\'\'")
      titleName = titleName.replace(/'+/g, "\'\'")
      let checkTitle = `SELECT [sTitleName] from UserTask where [sTitleName] = LTRIM(RTRIM('${titleName}'))`
      let [recordTitle] = (await pool.request().query(checkTitle)).recordsets
      if (recordTitle.length > 0) throw new Error("This Title is use already!")

      let command1 = `INSERT INTO [dbo].[UserTask]
             ([nTaskId],[sTitleName],[nLevelPermission],[bEnabled],[dCreated])
          VALUES
             ((SELECT MAX([nTaskId]) + 1 FROM [dbo].[UserTask]),LTRIM(RTRIM('${titleName}')),0,1,
             CONVERT(DATETIME, '${created.format('YYYY-MM-DD HH:mm:ss.SSS')}', 121))
          `
      for (const e of tasks) {
        if (e.sSubject.trim() == "") throw new Error("Don't use space !")
      }
      await pool.request().query(command1)
      let i = 0
      for (const e of tasks) {
        i += 1
        e.sSubject = e.sSubject.replace(/\s+/g," ")
        e.sSubject = e.sSubject.replace(/'/g, "\'\'")
        let command2 = `INSERT INTO [dbo].[UserTaskdetail] ([nTaskDetailId],[nTaskId],[sSubject],[sDescription],[nOrder],[bEnabled],[dCreated])
      VALUES ((SELECT MAX([nTaskDetailID]) + 1 FROM [dbo].[UserTaskDetail]),((SELECT MAX([nTaskId]) FROM [dbo].[UserTask])),
      LTRIM(RTRIM('${e.sSubject}')),'${(e.sDescription || '').replace(/'/g, "\'\'")}','${i}','True',
      CONVERT(DATETIME, '${created.format('YYYY-MM-DD HH:mm:ss.SSS')}', 121))
    `   
      await pool.request().query(command2)
      }
      res.json({ success: true })
    } else {
      // Update
      let check = `SELECT [sTitleName] from UserTask where [nTaskID] = ${key} `
      let [[recordCheck]] = (await pool.request().query(check)).recordsets
      titleName = titleName.replace(/\s+/g," ")
      titleName = titleName.replace(/'/g, "\'\'")
      if (recordCheck.sTitleName == titleName.trim()) {
        let command1 = `UPDATE [dbo].[UserTask] SET [sTitleName] = LTRIM(RTRIM('${titleName}')),
      [dCreated] = CONVERT(DATETIME,'${created.format('YYYY-MM-DD HH:mm:ss.SSS')}', 121) WHERE [nTaskId] = ${key}
          `
        for (const e of tasks) {
          if (e.sSubject.trim() == "") throw new Error("Don't use space !")
        }
        await pool.request().query(command1)
        let i = -1
        for (const e of tasks) {
          i += 1
          e.sSubject = e.sSubject.replace(/\s+/g," ")
          e.sSubject = e.sSubject.replace(/'/g, "\'\'")
          let command2 = `UPDATE [dbo].[UserTaskdetail] SET [sSubject] = LTRIM(RTRIM('${e.sSubject}')),[sDescription] = 
      '${(e.sDescription || '').replace(/'/g, "\'\'")}',[dCreated] = CONVERT(DATETIME,'${created.format('YYYY-MM-DD HH:mm:ss.SSS')}', 121) WHERE
      [nTaskDetailID] = (SELECT MIN([nTaskDetailID]) + ${i} FROM [dbo].[UserTaskDetail] WHERE [nTaskId] = ${key})
    `
        await pool.request().query(command2)
        }
        res.json({ success: true })
      } else {
        if (titleName.trim() == "") throw new Error("Don't use space !")
        titleName = titleName.replace(/\s+/g," ")
        titleName = titleName.replace(/'/g, "\'\'")
        let checkTitle = `SELECT [sTitleName] from UserTask where [sTitleName] = LTRIM(RTRIM('${titleName}'))`
        let [recordTitle] = (await pool.request().query(checkTitle)).recordsets
        if (recordTitle.length > 0) throw new Error("This Title is use already!")
        let command1 = `UPDATE [dbo].[UserTask] SET [sTitleName] = LTRIM(RTRIM('${titleName}')),
        [dCreated] = CONVERT(DATETIME,'${created.format('YYYY-MM-DD HH:mm:ss.SSS')}', 121) WHERE [nTaskId] = ${key}
          `
        for (const e of tasks) {
          if (e.sSubject.trim() == "") throw new Error("Don't use space !")
        }
        await pool.request().query(command1)
        let i = -1
        for (const e of tasks) {
          i += 1
          e.sSubject = e.sSubject.replace(/\s+/g," ")
          e.sSubject = e.sSubject.replace(/'/g, "\'\'")
          let command2 = `UPDATE [dbo].[UserTaskdetail] SET [sSubject] = LTRIM(RTRIM('${e.sSubject}')),[sDescription] = 
      '${(e.sDescription || '').replace(/'/g, "\'\'")}',[dCreated] = CONVERT(DATETIME,'${created.format('YYYY-MM-DD HH:mm:ss.SSS')}', 121) WHERE
          [nTaskDetailID] = (SELECT MIN([nTaskDetailID]) + ${i} FROM [dbo].[UserTaskDetail] WHERE [nTaskId] = ${key})
      `    
        await pool.request().query(command2)
        } 
        res.json({ success: true })
      }
    }
  } catch (ex) {
    logger.error(ex)
    res.json({ success: false, error: ex.message })
  } finally {
    pool.close()
    res.end()
  }
}
