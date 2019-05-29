const logger = require('@debuger')('SERVER')
const mssql = require('@mssql')
const lineInbound = require('../../line/flex-inbound')
const LINE = require('@line')
const fs = require('fs')

const moment = require('moment')

const asyncReadFile = file => new Promise((resolve, reject) => {
  fs.readFile(file, (err, data) => err ? reject(err) : resolve(data)) 
})

module.exports = async (req, res) => {
  let pool = { close: () => {} }
  try {
    let command = `
    SELECT 'wait' sStatus, CONVERT(VARCHAR,COUNT(*)) nTotal FROM POSGW..TFileTransUp a WITH(NOLOCK)
    WHERE a.sStatus IN (3,5) AND
      CONVERT(DATE,STUFF(STUFF(CONVERT(VARCHAR(8), nStartDate),5,0,'-'),8,0,'-')+' '
      +STUFF(STUFF(LEFT(RIGHT('000000' + CONVERT(VARCHAR(6), nStartTime), 6),6),3,0,':'),6,0,':'),120) < CONVERT(DATE, GETDATE())
    UNION ALL 
    SELECT 'error', CONVERT(VARCHAR,COUNT(*)) FROM POSGW..TFileTransUp a WITH(NOLOCK)
    WHERE a.sStatus IN (4,6,999) AND
      CONVERT(DATE,STUFF(STUFF(CONVERT(VARCHAR(8), nStartDate),5,0,'-'),8,0,'-')+' '
      +STUFF(STUFF(LEFT(RIGHT('000000' + CONVERT(VARCHAR(6), nStartTime), 6),6),3,0,':'),6,0,':'),120) = CONVERT(DATE, DATEADD(DAY, -1, GETDATE()))
	UNION ALL
	SELECT 'date', CONVERT(VARCHAR,MAX(CONVERT(DATETIME,STUFF(STUFF(CONVERT(VARCHAR(8), nEndDate),5,0,'-'),8,0,'-')+' '
      +STUFF(STUFF(LEFT(RIGHT('000000' + CONVERT(VARCHAR(6), nEndTime), 6),6),3,0,':'),6,0,':'),120)), 120) nEndDate 
	  FROM POSGW..TFileTransUp a WITH(NOLOCK)
    WHERE  CONVERT(DATE,STUFF(STUFF(CONVERT(VARCHAR(8), nStartDate),5,0,'-'),8,0,'-')+' '
      +STUFF(STUFF(LEFT(RIGHT('000000' + CONVERT(VARCHAR(6), nStartTime), 6),6),3,0,':'),6,0,':'),120) = CONVERT(DATE, DATEADD(DAY, -1, GETDATE()))
    `
    pool = await mssql('rep')
    let [ records ] = (await pool.request().query(command)).recordsets
    let [ wait, error, date ] = records

    wait = Number(wait['nTotal'])
    error = Number(error['nTotal'])
    date = date['nTotal']
    
    let logs = `\\\\10.101.147.55\\e$\\FTP Data\\POS\\prd\\Log\\InboundTransferService`
    let file = `${logs}\\${moment().add(-1, 'day').format('YYYYMMDD')}_InboundTransferService.txt`
    if (fs.existsSync(file)) {
      let data = await asyncReadFile(file)
      data = data.toString().split('\n').filter(e => /TimerElapsed Round Total/ig.test(e))
      let total = 0
      let zips = 0
      for (const line of data) {
        let [ , zip, elapse ] = /ZIP: (\d+) files.\((\d+)/ig.exec(line)
        zips += Number(zip)
        total += (Number(elapse) / Number(zip))
      }
      let avg = (Math.round(total / data.length) / 1000)
      let uptime = Math.round(total / 1000 / 60 / 60)
      let msg = `${uptime < 20 && avg < 20 ? 'OK' : 'WARN'} : Inbound Transfer Health Check`
      let flex = lineInbound(msg, wait, error, date, zips, avg.toFixed(0), uptime.toFixed(0))

      await LINE(flex, 'ris-sd3', 'C4af566ba4cf77cbc04dd1eff2f3bda38')
    } else {
      console.log('esapse avg: no-log')
    }
  } catch (ex) {
    logger.error(ex)
  } finally {
    pool.close()
    res.end()
  }
}
