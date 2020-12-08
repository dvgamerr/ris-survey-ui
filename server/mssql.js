const sql = require('mssql')
const logger = require('@touno-io/debuger')('MSSQL')

const db = require('./db')
module.exports = (name) =>
  new Promise((resolve, reject) => {
    const config =
      name || !(process.env.NODE_ENV === 'production') ? 'dev' : 'prd'
    logger.info(`Connection '${config}'...`)
    const conn = new sql.ConnectionPool(db[config])
    conn.connect((err) => {
      if (err) return reject(err)
      resolve(conn)
    })
  })
