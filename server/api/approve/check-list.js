const logger = require('@debuger')('SERVER')
const LINE = require('@line')
const request = require('request-promise')

const db = require('@mongo')
const lineMonitor = require('@line-flex-monitor')
const mssql = require('@mssql')

const moment = require('moment')
const posweb01 = `http://s-thcw-posweb01.pos.cmg.co.th:3000`

let i = 0
const main = async () => {
  const loop = (time) => {
    if (i) clearTimeout(i)
    i = setTimeout(() => main(), time)
  }
  let loopTime = 200
  let pool = { close: () => {} }
  try {
    let data = null
    try {
      data = await request(`${posweb01}/db/ris-sd3/cmd`, { json: true })
    } catch { }
    if (data && data.length > 0) {
      for (const cmd of data) {
        if (cmd.command !== 'survey' || !cmd.args) continue
        await request.post(`${posweb01}/db/ris-sd3/cmd/${cmd._id}`, { json: true })

        let [ app, approve ] = cmd.args
        if (app === 'dailyclose') {
          if (approve === '--approve') {
            let { User } = await db.open()
            let user = await User.findOne({ line_id: cmd.userId } )

            let { source } = cmd.event
            if (!cmd.event.replyToken) continue
            if (!user) {
              await request(`${posweb01}/ris-sd3/${cmd.event.replyToken}`, {
                method: 'PUT',
                body: { type: 'text', text: 'Reject!!' },
                json: true
              })
              continue
            }

            await request(`${posweb01}/ris-sd3/${cmd.event.replyToken}`, {
              method: 'PUT',
              body: { type: 'text', text: 'Roger that, ...' },
              json: true
            })
            
            let created = moment() // 2019-03-01 18:04:09.503
            let username = user.user_name
            let name = user.name 

            pool = await mssql()

            sql = `SELECT nTaskDetailId, sSubject, ISNULL(sDetail,'') sDetail, sDescription, sSolve, nOrder
              FROM UserTaskDetail d
              INNER JOIN UserTask t ON t.nTaskId = d.nTaskId
              WHERE d.bEnabled = 1 AND t.nTaskId = 1 ORDER BY nOrder ASC`
            let [ records ] = (await pool.request().query(sql)).recordsets

            let survey = records.map(e => {
              e.selected = true
              e.problem = false
              e.reason = ''
              e.status = ''
              return e
            })

            for (const e of survey) {
              let command = `INSERT INTO [dbo].[UserTaskSubmit] ([nTaskDetailId],[sUsername],[sName],[sStatus],[sRemark],[nType],[nOrder],[dCheckIn],[dCreated],[nVersion])
                VALUES (${e.nTaskDetailId},'${username.trim()}','${name}','${e.problem ? e.status : 'PASS'}', '${(e.reason || '').replace(`'`,`\'`)}'
                , 1, ${e.nOrder}, CONVERT(DATETIME, '${created.format('YYYY-MM-DD HH:mm:ss.SSS')}', 121),  GETDATE(), 1)
              `
              await pool.request().query(command)
            }
            await LINE(lineMonitor(name, survey))
          }
        }
      }
      loopTime = 100
    }
  } catch (ex) {
    logger.error(ex)
    loopTime = 30000
  } finally {
    pool.close()
  }
  loop(loopTime)
}

module.exports = main
