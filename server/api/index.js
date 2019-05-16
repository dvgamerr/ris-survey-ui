
const { Router } = require('express')
const router = Router()

require('./approve/check-list')()

router.get('/history/detail/:id', require('./history/detail'))
router.get('/history', require('./history'))
router.get('/history/:id', require('./history/id'))
router.post('/history/del/:id', require('./history/delete'))
router.get('/history/version/:id', require('./history/version'))

router.post('/history/submit', require('./history/submit'))

router.get('/monitor/check-hour/:hour', require('./monitor/check-hour'))

module.exports = router
