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

		// Click.uz to'lov URL yaratish
		const clickPaymentUrl = `https://my.click.uz/services/pay?service_id=${process.env.CLICK_SERVICE_ID}&merchant_id=${process.env.CLICK_MERCHANT_ID}&merchant_user_id=${process.env.CLICK_MERCHANT_USER_ID}&amount=${amount}&transaction_param=${transaction._id}`

		res.json({
			success: true,
			transactionId: transaction._id,
			paymentUrl: clickPaymentUrl,
			amount: amount
		})
	} catch (error) {
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
		next(error)
	}
})

// To'lovlar tarixi
router.get('/history', async (req, res, next) => {
	try {
		const { page = 1, limit = 10 } = req.query

		const transactions = await transactionModel
			.find({ provider: 'click' })
			.sort({ createdAt: -1 })
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
		next(error)
	}
})

// To'lov muvaffaqiyatli yakunlanganda
router.get('/success', async (req, res) => {
	const { transaction_param } = req.query

	// Frontend success page-ga redirect
	res.redirect(`${process.env.CLIENT_URL}/checkout/success?transaction_id=${transaction_param}`)
})

// To'lov muvaffaqiyatsiz yakunlanganda
router.get('/failure', async (req, res) => {
	const { transaction_param, error } = req.query

	// Frontend failure page-ga redirect
	res.redirect(`${process.env.CLIENT_URL}/checkout/failure?transaction_id=${transaction_param}&error=${error}`)
})

module.exports = router