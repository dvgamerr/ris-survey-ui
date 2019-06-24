
const { Router } = require('express')
const router = Router()

// require('./approve/check-list')()
router.get('/history/index/:id', require('./history/del'))
router.get('/history/new/:id', require('./history/editlist'))
router.get('/history/list/:id', require('./history/list'))
router.get('/history/home/', require('./history/home'))
router.get('/history', require('./history'))
router.get('/history/:id', require('./history/id'))
router.post('/history/del/:id', require('./history/del'))
router.get('/history/version/:id', require('./history/version'))

router.post('/history/submit', require('./history/submit'))
router.post('/history/new', require('./history/new'))
router.post('/history/del/', require('./history/del'))

router.get('/monitor/check-hour/:hour', require('./monitor/check-hour'))
router.get('/monitor/inbound-transfer', require('./monitor/inbound-transfer'))
router.get('/monitor/posdb-staging', require('./monitor/posdb-staging'))
router.get('/monitor/line-bot', require('./monitor/line-bot'))
// router.get('/monitor/flex/:color/:name/:desc', require('./monitor/flex'))

module.exports = router
