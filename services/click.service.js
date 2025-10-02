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

		const isAlreadyPaid = await transactionModel.findOne({
			id: click_trans_id,
			state: TransactionState.Paid,
			provider: 'click',
		})

		if (isAlreadyPaid) {
			return { error: ClickError.AlreadyPaid, error_note: 'Already paid' }
		}

		const transaction = await transactionModel.findOne({ id: click_trans_id })
		if (transaction && transaction.state === TransactionState.Canceled) {
			return { error: ClickError.TransactionCanceled, error_note: 'Transaction canceled' }
		}

		const time = new Date().getTime()

		const newTransaction = await transactionModel.create({
			id: click_trans_id,
			state: TransactionState.Pending,
			create_time: time,
			amount,
			prepare_id: time,
			provider: 'click',
		})

		// Telegram botga xabar yuborish
		try {
			await telegramService.sendPaymentPrepareNotification(transaction, transaction.items)
		} catch (error) {
			console.error('Telegram xabar yuborishda xatolik:', error.message)
		} return {
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

		const isPrepared = await transactionModel.findOne({ prepare_id: merchant_prepare_id, provider: 'click' })
		if (!isPrepared) {
			return { error: ClickError.TransactionNotFound, error_note: 'Transaction not found' }
		}

		const isAlreadyPaid = await transactionModel.findOne({ id: click_trans_id, state: TransactionState.Paid, provider: 'click' })
		if (isAlreadyPaid) {
			return { error: ClickError.AlreadyPaid, error_note: 'Already paid' }
		}

		const transaction = await transactionModel.findOne({ id: click_trans_id })
		if (transaction && transaction.state === TransactionState.Canceled) {
			return { error: ClickError.TransactionCanceled, error_note: 'Transaction canceled' }
		}

		const time = new Date().getTime()

		if (error < 0) {
			await transactionModel.findOneAndUpdate({ id: click_trans_id }, { state: TransactionState.Canceled, cancel_time: time })

			// Telegram'ga bekor qilish xabari
			try {
				const canceledTransaction = await transactionModel.findOne({ id: click_trans_id })
				await telegramService.sendPaymentCanceledNotification(canceledTransaction)
			} catch (err) {
				console.error('Telegram xabar yuborishda xatolik:', err)
			}

			return { error: ClickError.TransactionNotFound, error_note: 'Transaction not found' }
		}

		await transactionModel.findOneAndUpdate({ id: click_trans_id }, { state: TransactionState.Paid, perform_time: time })

		// Telegram'ga muvaffaqiyatli to'lov xabari
		try {
			const paidTransaction = await transactionModel.findOne({ id: click_trans_id })
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