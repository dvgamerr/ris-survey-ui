const mongoose = require('mongoose')
const moment = require('moment-timezone')

mongoose.Promise = Promise
moment.tz.setDefault(process.env.TZ || 'Asia/Bangkok')
let conn = { connected: () => false }
const logger = require('@touno-io/debuger')('MongoDB')
let mongodb = {
  MongoConnection: async () => {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/_test-devops'

    // mongodb://user:password@host:port,replicaSetHost:replicaSetPort/database?replicaSet=rs0.
    let conn = await mongoose.createConnection(MONGODB_URI, { useCreateIndex: true, useNewUrlParser: true, connectTimeoutMS: 10000, useUnifiedTopology: true })
    logger.log(`Connected. ${MONGODB_URI} (State is ${conn.readyState})`)
    conn.connected = () => conn.readyState === 1
    conn.Schema = {
      ObjectId: mongoose.Schema.ObjectId
    }
    return conn
  },
  MongoSchemaMapping: (conn, db) => {
    for (let i = 0; i < db.length; i++) {
      if (conn[db[i].id]) throw new Error(`MongoDB schema name is duplicate '${db[i].id}'`)
      conn[db[i].id] = conn.model(db[i].name, db[i].schema, db[i].name)
    }
  }
}

module.exports = {
  connected: () => false,
  open: async () => {
    if (!conn.connected()) {
      // eslint-disable-next-line require-atomic-updates
      conn = await mongodb.MongoConnection()
      mongodb.MongoSchemaMapping(conn, require('./schema'))
    }
    return conn
  }
}

