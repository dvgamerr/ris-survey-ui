const sql = require('mssql')

const db = require('./db')
module.exports = (name) => new Promise((resolve, reject) => {
  const conn = new sql.ConnectionPool(db[name ? name : (!(process.env.NODE_ENV === 'production') ? 'dev' : 'prd')])
  conn.connect(err => {
    if (err) return reject(err)
    resolve(conn)
  })
})
