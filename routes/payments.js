const express = require('express')
const transactionModel = require('../models/transaction.model')
const { TransactionState } = require('../enum/transaction.enum')

const router = express.Router()

// To'lov yaratish endpoint
router.post('/create', async (req, res, next) => {
	try {
		const { amount, description = 'Payment' } = req.body

		// Validation
		if (!amount || amount <= 0) {
			return res.status(400).json({
				success: false,
				message: 'Invalid amount'
			})
		}

		// Transaction yaratish
		const transaction = await transactionModel.create({
			amount: parseInt(amount),
			state: TransactionState.Pending,
			create_time: Date.now(),
			provider: 'click',
			prepare_id: `prepare_${Date.now()}`
		})

		// ✅ MUHIM: return_url qo'shildi
		// Click.uz to'lovdan keyin bu URLga qaytaradi
		const serverUrl = process.env.SERVER_URL || 'http://localhost:5000'
		const returnUrl = `${serverUrl}/payment/success`

		// Click.uz to'lov URL yaratish
		const clickPaymentUrl =
			`https://my.click.uz/services/pay?` +
			`service_id=${process.env.CLICK_SERVICE_ID}` +
			`&merchant_id=${process.env.CLICK_MERCHANT_ID}` +
			`&merchant_user_id=${process.env.CLICK_MERCHANT_USER_ID}` +
			`&amount=${amount}` +
			`&transaction_param=${transaction._id}` +
			`&return_url=${encodeURIComponent(returnUrl)}`

		// Debug log (production da o'chirish mumkin)
		console.log('💳 Click.uz payment URL yaratildi:', {
			transactionId: transaction._id,
			amount,
			returnUrl
		})

		res.json({
			success: true,
			transactionId: transaction._id,
			paymentUrl: clickPaymentUrl,
			amount: amount
		})
	} catch (error) {
		console.error('❌ Payment create error:', error)
		next(error)
	}
})

// To'lov holatini tekshirish
router.get('/status/:transactionId', async (req, res, next) => {
	try {
		const { transactionId } = req.params

		const transaction = await transactionModel.findById(transactionId)

		if (!transaction) {
			return res.status(404).json({
				success: false,
				message: 'Transaction not found'
			})
		}

		let status = 'pending'
		if (transaction.state === TransactionState.Paid) {
			status = 'paid'
		} else if (transaction.state === TransactionState.PendingCanceled || transaction.state === TransactionState.PaidCanceled) {
			status = 'failed'
		}

		res.json({
			success: true,
			transactionId: transaction._id,
			status: status,
			amount: transaction.amount,
			createdAt: new Date(transaction.create_time),
			paidAt: transaction.perform_time ? new Date(transaction.perform_time) : null,
			provider: transaction.provider
		})
	} catch (error) {
		console.error('❌ Status check error:', error)
		next(error)
	}
})

// To'lovlar tarixi
router.get('/history', async (req, res, next) => {
	try {
		const { page = 1, limit = 10 } = req.query

		const transactions = await transactionModel
			.find({ provider: 'click' })
			.sort({ create_time: -1 })  // ✅ create_time bo'yicha sort
			.limit(limit * 1)
			.skip((page - 1) * limit)

		const total = await transactionModel.countDocuments({ provider: 'click' })

		const payments = transactions.map(transaction => {
			let status = 'pending'
			if (transaction.state === TransactionState.Paid) {
				status = 'paid'
			} else if (transaction.state === TransactionState.PendingCanceled || transaction.state === TransactionState.PaidCanceled) {
				status = 'failed'
			}

			return {
				transactionId: transaction._id,
				amount: transaction.amount,
				status: status,
				createdAt: new Date(transaction.create_time),
				paidAt: transaction.perform_time ? new Date(transaction.perform_time) : null
			}
		})

		res.json({
			success: true,
			payments: payments,
			pagination: {
				currentPage: parseInt(page),
				totalPages: Math.ceil(total / limit),
				totalTransactions: total
			}
		})
	} catch (error) {
		console.error('❌ History error:', error)
		next(error)
	}
})

// ✅ TO'G'RILANGAN: To'lov muvaffaqiyatli yakunlanganda
// Frontend /payment/success sahifasiga redirect qiladi
router.get('/success', async (req, res) => {
	const { transaction_param } = req.query

	console.log('✅ Payment success redirect:', {
		transactionId: transaction_param,
		clientUrl: process.env.CLIENT_URL
	})

	// ✅ TO'G'RI: /payment/success (eski: /checkout/success)
	// ✅ TO'G'RI: transaction_param (eski: transaction_id)
	res.redirect(`${process.env.CLIENT_URL}/payment/success?transaction_param=${transaction_param}`)
})

// ✅ TO'G'RILANGAN: To'lov muvaffaqiyatsiz yakunlanganda
// Frontend /payment/failure sahifasiga redirect qiladi
router.get('/failure', async (req, res) => {
	const { transaction_param, error } = req.query

	console.log('❌ Payment failure redirect:', {
		transactionId: transaction_param,
		error: error || 'Payment cancelled',
		clientUrl: process.env.CLIENT_URL
	})

	// ✅ TO'G'RI: /payment/failure (eski: /checkout/failure)
	// ✅ TO'G'RI: transaction_param (eski: transaction_id)
	res.redirect(`${process.env.CLIENT_URL}/payment/failure?transaction_param=${transaction_param}&error=${encodeURIComponent(error || 'Payment cancelled')}`)
})

module.exports = router
