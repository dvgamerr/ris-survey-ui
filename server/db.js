module.exports = {
  'dev': {
    user: 'posappadm',
    password: 'qwerty8*',
    server: '10.0.80.46\\poscmg',
    database: 'SURVEY_CMG',
    options: {}
  },
  'prd': {
    user: 'T1CAdmin',
    password: 'T!C@dmin',
    server: 'S-THCW-POSDB95\\CMGSTAGING',
    database: 'POSDEVOPS_UI',
    options: { encrypt: true }
  },
  'noti': {
    user: 'posowner',
    password: `,yo,ur]y'55`,
    server: 'posdb.cmg.co.th',
    database: 'LINE_BOT',
    options: {
      encrypt: true
    }
  },
  'rep': {
    user: 'posquery',
    password: `ycmgquer`,
    server: 'posdbrep.cmg.co.th',
    database: 'POSGW'
  },
  'staging': {
    user: 'T1CAdmin',
    password: `T!C@dmin`,
    server: '10.101.147.70\\cmgstaging',
    database: 'POSSTAGING'
  }
}
