require('express-group-routes')

const clickController = require('../controllers/click.controller')
const orderController = require('../controllers/order.controller')
const router = require('express').Router()

// Click.uz webhook endpoints
router.group('/click', route => {
	// Yagona webhook endpoint (tavsiya etiladi)
	route.post('/webhook', clickController.webhook)
	
	// Eski endpoint'lar (backward compatibility)
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

// Payment endpoint (frontend uchun)
router.group('/payments', route => {
	route.post('/create', orderController.createOrder)
	route.get('/:orderId', orderController.getOrder)
	route.get('/', orderController.getAllOrders)
})

module.exports = router
