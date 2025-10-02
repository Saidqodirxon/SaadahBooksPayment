require('express-group-routes')

const clickController = require('../controllers/click.controller')
const orderController = require('../controllers/order.controller')
const router = require('express').Router()

// Click.uz webhook endpoints
router.group('/click', route => {
	route.post('/prepare', clickController.prepare)
	route.post('/complete', clickController.complete)
})

// Order endpoints
router.group('/orders', route => {
	route.post('/', orderController.createOrder)
	route.get('/', orderController.getAllOrders)
	route.get('/statistics', orderController.getStatistics)
	route.get('/:orderId', orderController.getOrder)
})

module.exports = router
