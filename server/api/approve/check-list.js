// const logger = require('@touno-io/debuger')('SERVER')
const LINE = require('@line')
const request = require('request-promise')

const db = require('@mongo')
const lineMonitor = require('@line-flex-monitor')
const mssql = require('@mssql')

const moment = require('moment')
const posweb01 = `http://posgateway.cmg.co.th:3000/`

module.exports = async (req, res) => {
  let pool = { close: () => { } }
  try {
    let cmd = req.body || {}
    if (cmd.command !== 'survey' || !cmd.args) return res.end()
    await request.post(`${posweb01}/db/ris-sd3/cmd/${cmd._id}`, { json: true })

    let [app, approve] = cmd.args
    if (app === 'dailyclose') {
      if (approve === '--approve') {
        let { User } = await db.open()
        let user = await User.findOne({ line_id: cmd.userId })
        if (!user || !cmd.event.replyToken) return res.end()
        let { source } = cmd.event

        await request(`${posweb01}/ris-sd3/${source[`${source.type}Id`]}`, {
          method: 'PUT',
          body: { type: 'text', text: 'Roger that!, ...' },
          json: true
        })

        let created = moment() // 2019-03-01 18:04:09.503
        let username = user.user_name
        let name = user.name

        pool = await mssql()

        let sql = `SELECT nTaskDetailId, sSubject, ISNULL(sDetail,'') sDetail, sDescription, sSolve, nOrder
        FROM UserTaskDetail d
        INNER JOIN UserTask t ON t.nTaskId = d.nTaskId
        WHERE d.bEnabled = 1 AND t.nTaskId = 1 ORDER BY nOrder ASC`
        let [records] = (await pool.request().query(sql)).recordsets

        let survey = records.map(e => {
          e.selected = true
          e.problem = false
          e.reason = ''
          e.status = ''
          return e
        })

        for (const e of survey) {
          let command = `INSERT INTO [dbo].[UserTaskSubmit] ([nTaskDetailId],[sUsername],[sName],[sStatus],[sRemark],[nType],[nOrder],[dCheckIn],[dCreated],[nVersion])
            VALUES (${e.nTaskDetailId},'${username.trim()}','${name}','${e.problem ? e.status : 'PASS'}', '${(e.reason || '').replace(`'`, `\\'`)}'
            , 1, ${e.nOrder}, CONVERT(DATETIME, '${created.format('YYYY-MM-DD HH:mm:ss.SSS')}', 121),  GETDATE(), 1)
          `
          await pool.request().query(command)
        }
        await LINE(lineMonitor(name, survey))
        await request(`${posweb01}/ris-sd3/${source[`${source.type}Id`]}`, {
          method: 'PUT',
          body: { type: 'text', text: 'Successful.' },
          json: true
        })
      }
    }
  } catch (ex) {
    res.json({ error: ex.message, stack: ex.stack })
  } finally {
    pool.close()
    res.end()
  }
}
