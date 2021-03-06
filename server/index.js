const express = require('express')
const bodyParser = require('body-parser')
const { Nuxt, Builder } = require('nuxt')
const app = express()

const logger = require('@touno-io/debuger')('NUXTJS')
// Import and Set Nuxt.js options
const config = require('../nuxt.config.js')
config.dev = !(process.env.NODE_ENV === 'production')

const host = process.env.HOST || '127.0.0.1'
const port = process.env.PORT || 3000

// Build only in dev mode
app.use((req, res, next) => {
  const methodAllow = [ 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT' ]
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', '*')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods', methodAllow.join(','))
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const auth = require('./authication')

app.use(auth.path, auth.handler)

app.use('/api', require('./api'))

const NuxtBuilder = async () => {
  // Init Nuxt.js
  const nuxt = new Nuxt(config)
  if (config.dev) {
    const builder = new Builder(nuxt)
    await builder.build()
  } else {
    await nuxt.ready()
  }
  // Listen the server
  app.use(nuxt.render)
  await app.listen(port, host)
  logger.start(`Listening on http://${host}:${port}`)
}

NuxtBuilder().catch(ex => {
  logger.error(ex)
  process.exit(1)
})
