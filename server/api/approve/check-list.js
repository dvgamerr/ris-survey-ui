// const logger = require('@touno-io/debuger')('SERVER')
const request = require('request-promise')
const moment = require('moment')
const LINE = require('../../line')

const db = require('../../mongodb')
const lineMonitor = require('../../line/flex-monitor.js')
const mssql = require('../../mssql')

const posweb01 = `http://posgateway.cmg.co.th:3000/`

module.exports = async (req, res) => {
  let pool = { close: () => {} }
  try {
    const cmd = req.body || {}
    if (cmd.command !== 'survey' || !cmd.args) return res.end()
    await request.post(`${posweb01}/db/ris-sd3/cmd/${cmd._id}`, { json: true })

    const [app, approve] = cmd.args
    if (app === 'dailyclose') {
      if (approve === '--approve') {
        const { User } = await db.open()
        const user = await User.findOne({ line_id: cmd.userId })
        if (!user || !cmd.event.replyToken) return res.end()
        const { source } = cmd.event

        await request(`${posweb01}/ris-sd3/${source[`${source.type}Id`]}`, {
          method: 'PUT',
          body: { type: 'text', text: 'Roger that!, ...' },
          json: true,
        })

        const created = moment() // 2019-03-01 18:04:09.503
        const username = user.user_name
        const name = user.name

        pool = await mssql()

        const sql = `SELECT nTaskDetailId, sSubject, ISNULL(sDetail,'') sDetail, sDescription, sSolve, nOrder
        FROM UserTaskDetail d
        INNER JOIN UserTask t ON t.nTaskId = d.nTaskId
        WHERE d.bEnabled = 1 AND t.nTaskId = 1 ORDER BY nOrder ASC`
        const [records] = (await pool.request().query(sql)).recordsets

        const survey = records.map((e) => {
          e.selected = true
          e.problem = false
          e.reason = ''
          e.status = ''
          return e
        })

        for (const e of survey) {
          const command = `INSERT INTO [dbo].[UserTaskSubmit] ([nTaskDetailId],[sUsername],[sName],[sStatus],[sRemark],[nType],[nOrder],[dCheckIn],[dCreated],[nVersion])
            VALUES (${e.nTaskDetailId},'${username.trim()}','${name}','${
            e.problem ? e.status : 'PASS'
          }', '${(e.reason || '').replace(`'`, `\\'`)}'
            , 1, ${e.nOrder}, CONVERT(DATETIME, '${created.format(
            'YYYY-MM-DD HH:mm:ss.SSS'
          )}', 121),  GETDATE(), 1)
          `
          await pool.request().query(command)
        }
        await LINE(lineMonitor(name, survey))
        await request(`${posweb01}/ris-sd3/${source[`${source.type}Id`]}`, {
          method: 'PUT',
          body: { type: 'text', text: 'Successful.' },
          json: true,
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
