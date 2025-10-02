const orderService = require('../services/order.service')

class OrderController {
	// Yangi buyurtma yaratish
	async createOrder(req, res, next) {
		try {
			const { items, customerName, customerEmail, customerPhone } = req.body

			// Validatsiya
			if (!items || !Array.isArray(items) || items.length === 0) {
				return res.status(400).json({ error: 'Kitoblar ro\'yxati bo\'sh' })
			}

			// Har bir kitob formatini tekshirish
			for (const item of items) {
				if (!item.title || !item.price || !item.qty) {
					return res.status(400).json({
						error: 'Kitob ma\'lumotlari to\'liq emas. title, price, qty majburiy',
					})
				}
			}

			if (!customerName || !customerEmail || !customerPhone) {
				return res.status(400).json({ error: 'Mijoz ma\'lumotlari to\'liq emas' })
			}

			const result = await orderService.createOrder({
				items,
				customerName,
				customerEmail,
				customerPhone,
			})

			res.status(201).json(result)
		} catch (error) {
			next(error)
		}
	}

	// Buyurtma ma'lumotlarini olish
	async getOrder(req, res, next) {
		try {
			const { orderId } = req.params
			const order = await orderService.getOrderById(orderId)

			res.json(order)
		} catch (error) {
			next(error)
		}
	}

	// Barcha buyurtmalarni olish
	async getAllOrders(req, res, next) {
		try {
			const { state, startDate, endDate, limit, skip } = req.query

			const filters = {
				state: state ? parseInt(state) : undefined,
				startDate,
				endDate,
				limit: limit ? parseInt(limit) : 50,
				skip: skip ? parseInt(skip) : 0,
			}

			const result = await orderService.getAllOrders(filters)

			res.json(result)
		} catch (error) {
			next(error)
		}
	}

	// Statistika
	async getStatistics(req, res, next) {
		try {
			const { startDate, endDate } = req.query
			const stats = await orderService.getStatistics(startDate, endDate)

			res.json(stats)
		} catch (error) {
			next(error)
		}
	}
}

module.exports = new OrderController()
