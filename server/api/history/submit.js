const logger = require('@touno-io/debuger')('SERVER')
const moment = require('moment')
const lineMonitor = require('../../line/flex-monitor')
const mssql = require('../../mssql')
const LINE = require('../../line')

module.exports = async (req, res) => {
  let pool = { close: () => {} }
  try {
    const { key, name, username, tasks } = req.body
    let created = moment() // 2019-03-01 18:04:09.503
    const updated = []
    pool = await mssql()
    for (const e of tasks) {
      let nVersion = 1
      let isUpdated = false
      if (key) {
        const dCheckIn = moment(key, 'YYYYMMDDHHmmssSSS')
        created = dCheckIn
        const checkRow = `
          SELECT sStatus, sRemark, nVersion
          FROM UserTaskSubmit s
          INNER JOIN UserTaskDetail t ON t.nTaskDetailId = s.nTaskDetailId
          INNER JOIN (
            SELECT MAX(nIndex) nIndex  FROM UserTaskSubmit
            WHERE dCheckIn = CONVERT(DATETIME, '${dCheckIn.format(
              'YYYY-MM-DD HH:mm:ss.SSS'
            )}') AND nTaskDetailId = ${e.nTaskDetailId}
          ) i ON i.nIndex = s.nIndex
        `
        const [[record]] = (await pool.request().query(checkRow)).recordsets
        const sStatus = record.sStatus === (e.problem ? e.status : 'PASS')
        const sRemark = record.sRemark === (e.reason || '')
        if (!sStatus || !sRemark) {
          nVersion = parseInt(record.nVersion) + 1
          isUpdated = true
        }
      }

      if (!key || isUpdated) {
        const command = `INSERT INTO [dbo].[UserTaskSubmit] ([nTaskDetailId],[sUsername],[sName],[sStatus],[sRemark],[nType],[nOrder],[dCheckIn],[dCreated],[nVersion])
          VALUES (${e.nTaskDetailId},'${username.trim()}','${name}','${
          e.problem ? e.status : 'PASS'
        }', '${(e.reason || '').replace(/'/g, "''")}'
          , 1, ${e.nOrder}, CONVERT(DATETIME, '${created.format(
          'YYYY-MM-DD HH:mm:ss.SSS'
        )}', 121),  GETDATE(), ${nVersion})
        `
        await pool.request().query(command)
        updated.push(e)
      }
    }

    const totalFail = tasks.filter((e) => e.status === 'FAIL').length
    const totalWarn = tasks.filter((e) => e.status === 'WARN').length
    const totalInfo = tasks.filter((e) => e.status === 'INFO').length

    const topName = `Summary Monitor DailyClose`
    const topStatus =
      totalFail > 0
        ? 'FAIL'
        : totalWarn > 0
        ? 'WARN'
        : totalInfo > 0
        ? 'INFO'
        : 'PASS'
    const topDate = moment().format('HH:mm, DD MMM YYYY')

    const logText = `Monitor ${
      updated.length > 0 ? updated.length : tasks.length
    } (F:${totalFail} W:${totalWarn}  I:${totalInfo})`
    logger.info(
      logText,
      created.format('YYYY-MM-DD HH:mm:ss.SSS'),
      key ? 'Updated.' : 'Insterted.'
    )
    if (!key) {
      // สรุป Monitor DailyClose 21.03.2019 Time 22.30
      LINE(lineMonitor(name, tasks))
      // LINE(`*[${topStatus}] ${topName}*\n${msg}\n\n(${name} at ${topDate})`, req.body)
    } else if (updated.length > 0) {
      LINE(
        lineMonitor(
          name,
          updated,
          `http://10.0.80.52:3000/history/version/${key}`
        )
      )
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
