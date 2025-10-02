const transactionModel = require('../models/transaction.model')
const telegramService = require('./telegram.service')

class OrderService {
	// Yangi buyurtma yaratish
	async createOrder(orderData) {
		try {
			const { items, customerName, customerEmail, customerPhone } = orderData

			// Validatsiya
			if (!items || !Array.isArray(items) || items.length === 0) {
				throw new Error('Kitoblar ro\'yxati bo\'sh')
			}

			// Har bir kitob to'g'ri formatda ekanligini tekshirish
			for (const item of items) {
				if (!item.title || !item.price || !item.qty) {
					throw new Error('Kitob ma\'lumotlari to\'liq emas (title, price, qty majburiy)')
				}
			}

			// Umumiy narxni hisoblash
			const totalAmount = items.reduce((sum, item) => sum + item.price * item.qty, 0)

			// Transaction yaratish
			const transaction = await transactionModel.create({
				items,
				customerName,
				customerEmail,
				customerPhone,
				amount: totalAmount,
				state: 0, // Pending
				provider: 'click',
				create_time: Date.now(),
			})

			// Telegram'ga order yaratildi xabari
			try {
				await telegramService.sendOrderCreatedNotification(transaction, items)
				console.log('📱 Telegram order created notification sent')
			} catch (err) {
				console.error('Telegram notification error:', err.message)
			}

			// Click.uz to'lov URL'ini yaratish
			const clickUrl = this.generateClickUrl(transaction._id, totalAmount)

			return {
				success: true,
				orderId: transaction._id,
				amount: totalAmount,
				click_url: clickUrl,
			}
		} catch (error) {
			console.error('Buyurtma yaratishda xatolik:', error)
			throw error
		}
	}

	// Click.uz to'lov URL'ini yaratish
	generateClickUrl(orderId, amount) {
		const serviceId = process.env.CLICK_SERVICE_ID || '83510'
		const merchantId = process.env.CLICK_MERCHANT_ID || '46304'
		const returnUrl = process.env.CLIENT_URL || 'https://saadahbooks.uz'

		return `https://my.click.uz/services/pay?service_id=${serviceId}&merchant_id=${merchantId}&amount=${amount}&transaction_param=${orderId}&return_url=${returnUrl}/payment/success`
	}

	// Buyurtma ma'lumotlarini olish
	async getOrderById(orderId) {
		try {
			const transaction = await transactionModel.findById(orderId)

			if (!transaction) {
				throw new Error('Buyurtma topilmadi')
			}

			return transaction
		} catch (error) {
			console.error('Buyurtma olishda xatolik:', error)
			throw error
		}
	}

	// Barcha buyurtmalarni olish
	async getAllOrders(filters = {}) {
		try {
			const { state, startDate, endDate, limit = 50, skip = 0 } = filters

			const query = {}

			if (state !== undefined) {
				query.state = state
			}

			if (startDate || endDate) {
				query.create_time = {}
				if (startDate) query.create_time.$gte = new Date(startDate).getTime()
				if (endDate) query.create_time.$lte = new Date(endDate).getTime()
			}

			const transactions = await transactionModel.find(query).sort({ create_time: -1 }).limit(limit).skip(skip)

			const total = await transactionModel.countDocuments(query)

			return {
				transactions,
				total,
				limit,
				skip,
			}
		} catch (error) {
			console.error('Buyurtmalarni olishda xatolik:', error)
			throw error
		}
	}

	// Statistika
	async getStatistics(startDate, endDate) {
		try {
			const query = {}

			if (startDate || endDate) {
				query.create_time = {}
				if (startDate) query.create_time.$gte = new Date(startDate).getTime()
				if (endDate) query.create_time.$lte = new Date(endDate).getTime()
			}

			const transactions = await transactionModel.find(query)

			const stats = {
				totalRevenue: 0,
				totalBooks: 0,
				totalCustomers: new Set(),
				successfulPayments: 0,
				canceledPayments: 0,
				pendingPayments: 0,
			}

			transactions.forEach(transaction => {
				if (transaction.state === 2) {
					// Paid
					stats.totalRevenue += transaction.amount
					stats.successfulPayments++
					stats.totalBooks += transaction.items ? transaction.items.reduce((sum, item) => sum + item.qty, 0) : 0
					if (transaction.customerEmail) {
						stats.totalCustomers.add(transaction.customerEmail)
					}
				} else if (transaction.state === -1 || transaction.state === -2) {
					// Canceled
					stats.canceledPayments++
				} else if (transaction.state === 1) {
					// Pending
					stats.pendingPayments++
				}
			})

			stats.totalCustomers = stats.totalCustomers.size

			return stats
		} catch (error) {
			console.error('Statistika olishda xatolik:', error)
			throw error
		}
	}
}

module.exports = new OrderService()
