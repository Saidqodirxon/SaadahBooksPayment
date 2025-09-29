require('express-group-routes')

const clickController = require('../controllers/click.controller')
const paymentRoutes = require('./payments')
const router = require('express').Router()

// Click.uz webhook endpoints
router.group('/click', route => {
	route.post('/prepare', clickController.prepare)
	route.post('/complete', clickController.complete)
})

// Payment management endpoints
router.use('/payments', paymentRoutes)

module.exports = router
