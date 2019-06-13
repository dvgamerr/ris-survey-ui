const logger = require('@debuger')('SERVER')
const mssql = require('@mssql')
const moment = require('moment')

module.exports = async (req, res) => {
  let pool = { close: () => {} }
  try {
    let created = moment() // 2019-03-01 18:04:09.503
    pool = await mssql()
      if (key) {
        let dCheckIn = moment(key, 'YYYYMMDDHHmmssSSS')
        created = dCheckIn
        let checkRow = `
        SELECT max(nTaskID) from UserTask
        `
        let [ [ record ] ] = (await pool.request().query(checkRow)).recordsets
          nTaskId = parseInt(record['[nTaskId']) + 1
        }

      if (!key || isUpdated) {
        let command = `INSERT INTO [dbo].[UserTask]
           ([nTaskId],[sTitleName],[nLevelPermission],[bEnabled],[dCreated])
        VALUES
           (${nTaskId},${sTitleName},0,True,CONVERT(DATETIME, '${created.format('YYYY-MM-DD HH:mm:ss.SSS')}')
        `
        // let command = `INSERT INTO [dbo].[UserTaskdetail] ([nTaskDetailId]
        //   ,[nTaskId]//หมวดหมู่*
        //   ,[sSubject]//title*
        //   ,[nOrder]//เรียงหัวข้อในหมวดหมู่
        //   ,[bEnabled]=Trueเสมอ
        //   ,[dCreated]//getdate))
        //   VALUES (${e.nTaskId},'${e.sSubject}','${e.nOrder}','True', CONVERT(DATETIME, '${created.format('YYYY-MM-DD HH:mm:ss.SSS')}')
        // `
        await pool.request().query(command)
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
