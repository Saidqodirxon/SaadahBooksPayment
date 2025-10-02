const transactionModel = require('../models/transaction.model')
const telegramService = require('./telegram.service')
const clickCheckToken = require('../utils/click-check')
const { ClickError, ClickAction, TransactionState } = require('../enum/transaction.enum')

class ClickService {
	async prepare(data) {
		const { click_trans_id, service_id, merchant_trans_id, amount, action, sign_time, sign_string } = data

		const signatureData = { click_trans_id, service_id, merchant_trans_id, amount, action, sign_time }

		const checkSignature = clickCheckToken(signatureData, sign_string)
		if (!checkSignature) {
			return { error: ClickError.SignFailed, error_note: 'Invalid sign' }
		}

		if (parseInt(action) !== ClickAction.Prepare) {
			return { error: ClickError.ActionNotFound, error_note: 'Action not found' }
		}

		// merchant_trans_id orqali transaction topish (Frontend yaratgan)
		const transaction = await transactionModel.findById(merchant_trans_id)
		
		if (!transaction) {
			return { error: ClickError.TransactionNotFound, error_note: 'Transaction not found' }
		}

		// Allaqachon to'langan bo'lsa
		if (transaction.state === TransactionState.Paid) {
			return { error: ClickError.AlreadyPaid, error_note: 'Already paid' }
		}

		// Bekor qilingan bo'lsa
		if (transaction.state === TransactionState.Canceled) {
			return { error: ClickError.TransactionCanceled, error_note: 'Transaction canceled' }
		}

		// Summani tekshirish
		if (parseInt(amount) !== transaction.amount) {
			return { error: ClickError.InvalidAmount, error_note: 'Invalid amount' }
		}

		const time = new Date().getTime()

		// Transaction'ni yangilash - Click ma'lumotlarini qo'shish
		await transactionModel.findByIdAndUpdate(merchant_trans_id, {
			id: click_trans_id,
			state: TransactionState.Preparing,
			prepare_id: time,
		})

		// Yangilangan transactionni olish
		const updatedTransaction = await transactionModel.findById(merchant_trans_id)

		// Telegram botga xabar yuborish
		try {
			await telegramService.sendPaymentPrepareNotification(updatedTransaction, updatedTransaction.items)
		} catch (error) {
			console.error('Telegram xabar yuborishda xatolik:', error.message)
		}

		return {
			click_trans_id,
			merchant_trans_id,
			merchant_prepare_id: time,
			error: ClickError.Success,
			error_note: 'Success',
		}
	}

	async complete(data) {
		const { click_trans_id, service_id, merchant_trans_id, merchant_prepare_id, amount, action, sign_time, sign_string, error } =
			data

		const signatureData = { click_trans_id, service_id, merchant_trans_id, merchant_prepare_id, amount, action, sign_time }

		const checkSignature = clickCheckToken(signatureData, sign_string)

		if (!checkSignature) {
			return { error: ClickError.SignFailed, error_note: 'Invalid sign' }
		}

		if (parseInt(action) !== ClickAction.Complete) {
			return { error: ClickError.ActionNotFound, error_note: 'Action not found' }
		}

		// merchant_trans_id orqali transaction topish
		const transaction = await transactionModel.findById(merchant_trans_id)
		
		if (!transaction) {
			return { error: ClickError.TransactionNotFound, error_note: 'Transaction not found' }
		}

		// prepare_id tekshirish
		if (transaction.prepare_id !== parseInt(merchant_prepare_id)) {
			return { error: ClickError.TransactionNotFound, error_note: 'Prepare ID does not match' }
		}

		// Allaqachon to'langan bo'lsa
		if (transaction.state === TransactionState.Paid) {
			return { error: ClickError.AlreadyPaid, error_note: 'Already paid' }
		}

		// Bekor qilingan bo'lsa
		if (transaction.state === TransactionState.Canceled) {
			return { error: ClickError.TransactionCanceled, error_note: 'Transaction canceled' }
		}

		const time = new Date().getTime()

		// Agar Click.uz dan error kelsa - bekor qilish
		if (error < 0) {
			await transactionModel.findByIdAndUpdate(merchant_trans_id, {
				state: TransactionState.Canceled,
				cancel_time: time,
			})

			// Telegram'ga bekor qilish xabari
			try {
				const canceledTransaction = await transactionModel.findById(merchant_trans_id)
				await telegramService.sendPaymentCanceledNotification(canceledTransaction)
			} catch (err) {
				console.error('Telegram xabar yuborishda xatolik:', err)
			}

			return { error: ClickError.TransactionCanceled, error_note: 'Transaction canceled by user' }
		}

		// To'lovni tasdiqlash
		await transactionModel.findByIdAndUpdate(merchant_trans_id, {
			state: TransactionState.Paid,
			perform_time: time,
		})

		// Telegram'ga muvaffaqiyatli to'lov xabari
		try {
			const paidTransaction = await transactionModel.findById(merchant_trans_id)
			const items = paidTransaction.items || []
			await telegramService.sendPaymentNotification(paidTransaction, items)
		} catch (err) {
			console.error('Telegram xabar yuborishda xatolik:', err)
		}

		return {
			click_trans_id,
			merchant_trans_id,
			merchant_confirm_id: time,
			error: ClickError.Success,
			error_note: 'Success',
		}
	}
}

module.exports = new ClickService()
