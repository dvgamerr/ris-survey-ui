const logger = require('@touno-io/debuger')('SERVER')
const mssql = require('@mssql')
const lineStaging = require('../../line/flex-staging')
const LINE = require('@line')
const moment = require('moment')


module.exports = async (req, res) => {
  let pool = { close: () => {} }

  const getRecords = async command => {
    pool = await mssql('staging')
    let [ records ] = (await pool.request().query(command)).recordsets
    return records
  }

  try {
    let [ usage, task, mSuccess ] = await getRecords(`
    select DATEDIFF(MINUTE, MIN([Date]), MAX([Date])) [val]
    from TLDTSLog
    WHERE CONVERT(DATE,[Date]) = CONVERT(DATE,DATEADD(DAY, -1, GETDATE()))
    AND [Logger] <> 'Staging-Transection'
    UNION ALL
    select COUNT(*) from TLDTSLog
    WHERE CONVERT(DATE,[Date]) = CONVERT(DATE,DATEADD(DAY, -1, GETDATE()))
    AND [Logger] <> 'Staging-Transection'
    UNION ALL
    select COUNT(*) from TLDTSLog
    WHERE CONVERT(DATE,[Date]) = CONVERT(DATE,DATEADD(DAY, -1, GETDATE()))
    AND [Logger] <> 'Staging-Transection' AND ([Message] LIKE '%Finished DTS%' OR [Message] LIKE '%Start DTS%')
    `)
    
    usage = Number(usage['val'])
    task = Number(task['val'])
    mSuccess = Number(mSuccess['val']) === 2

    let [ max ] = await getRecords(`
    SELECT max([min]) [val] FROM
    (
      select DATEDIFF(MINUTE, MIN([Date]), MAX([Date])) [min] from TLDTSLog a
      INNER JOIN (
        select Reserve1 from TLDTSLog
        WHERE CONVERT(DATE,[Date]) = CONVERT(DATE,DATEADD(DAY, -1, GETDATE()))
        AND [Message] LIKE '%Merge Table%' AND [Message] NOT LIKE '%(0 rows)'
      ) b ON b.Reserve1 = a.Reserve1
      GROUP BY a.Reserve1
    ) a
    `)
    max = Number(max['val'])
    
    let sales = 0
    let records = await getRecords(`
    select [Message] from TLDTSLog
    WHERE CONVERT(DATE,[Date]) = CONVERT(DATE,DATEADD(DAY, -1, GETDATE()))
    AND [Message] LIKE '%Merge Table%' AND [Message] NOT LIKE '%(0 rows)'
    
    `)
    for (const row of records) {
      let [ , rows ] =  /\((\d+)/ig.exec(row['Message'])
      sales += Number(rows)
    }

    let [ tSuccess ] = await getRecords(`
    SELECT COUNT(*) t
    FROM (
    select Reserve1 from POSSTAGING..TLDTSLog
    WHERE CONVERT(DATE,[Date]) = CONVERT(DATE,DATEADD(DAY, -1, GETDATE()))
      AND ([Message] LIKE 'SUCCESS' OR [Message] LIKE 'BEGIN%')
    GROUP BY Reserve1
    HAVING COUNT(*) < 2
    ) a
    `)
    tSuccess = Number(tSuccess['t'])

    let msg = `${mSuccess && tSuccess === 0 ? 'OK' : 'WARN'} : POSDB Staging Health Check`
    let flex = lineStaging(msg, usage, task, mSuccess, max, sales, tSuccess)
    await LINE(flex, 'ris-sd3', 'U9e0a870c01ca97da20a4ec462bf72991')

  } catch (ex) {
    logger.error(ex)
  } finally {
    pool.close()
    res.end()
  }
}
