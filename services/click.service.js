const transactionModel = require('../models/transaction.model')
const telegramService = require('./telegram.service')
const clickCheckToken = require('../utils/click-check')
const { ClickError, ClickAction, TransactionState } = require('../enum/transaction.enum')

class ClickService {
	async prepare(data) {
		console.log('\n=== CLICK PREPARE ===')
		console.log('Data:', JSON.stringify(data, null, 2))

		const { click_trans_id, service_id, merchant_trans_id, amount, action, sign_time, sign_string } = data

		// 1. Signature check
		const signatureData = { click_trans_id, service_id, merchant_trans_id, amount, action, sign_time }
		const checkSignature = clickCheckToken(signatureData, sign_string)
		
		if (!checkSignature) {
			console.log('❌ Signature failed')
			return { error: ClickError.SignFailed, error_note: 'Invalid sign' }
		}

		// 2. Action check
		if (parseInt(action) !== ClickAction.Prepare) {
			console.log('❌ Wrong action:', action)
			return { error: ClickError.ActionNotFound, error_note: 'Action not found' }
		}

		// 3. Check if already paid
		const isAlreadyPaid = await transactionModel.findOne({
			_id: merchant_trans_id,
			state: TransactionState.Paid,
			provider: 'click',
		})

		if (isAlreadyPaid) {
			console.log('❌ Already paid')
			return {
				click_trans_id,
				merchant_trans_id,
				merchant_prepare_id: isAlreadyPaid.prepare_id,
				error: ClickError.AlreadyPaid,
				error_note: 'Already paid'
			}
		}

		// 4. Check if canceled
		const transaction = await transactionModel.findById(merchant_trans_id)
		
		if (!transaction) {
			console.log('❌ Transaction not found')
			return { error: ClickError.TransactionNotFound, error_note: 'Transaction not found' }
		}

		if (transaction.state === TransactionState.Canceled) {
			console.log('❌ Transaction canceled')
			return { error: ClickError.TransactionCanceled, error_note: 'Transaction canceled' }
		}

		// 5. Update to Preparing state
		const time = new Date().getTime()

		await transactionModel.findByIdAndUpdate(merchant_trans_id, {
			state: TransactionState.Preparing,
			prepare_id: time,
			create_time: time,
		})

		console.log('✅ Prepare successful, prepare_id:', time)

		// Telegram notification
		try {
			const preparedTransaction = await transactionModel.findById(merchant_trans_id)
			const items = preparedTransaction.items || []
			await telegramService.sendPaymentPrepareNotification(preparedTransaction, items)
			console.log('📱 Telegram sent')
		} catch (err) {
			console.error('Telegram error:', err.message)
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
		console.log('\n=== CLICK COMPLETE ===')
		console.log('Data:', JSON.stringify(data, null, 2))

		const { click_trans_id, service_id, merchant_trans_id, merchant_prepare_id, amount, action, sign_time, sign_string, error } = data

		// 1. Signature check
		const signatureData = { click_trans_id, service_id, merchant_trans_id, merchant_prepare_id, amount, action, sign_time }
		const checkSignature = clickCheckToken(signatureData, sign_string)

		if (!checkSignature) {
			console.log('❌ Signature failed')
			return { error: ClickError.SignFailed, error_note: 'Invalid sign' }
		}

		// 2. Action check
		if (parseInt(action) !== ClickAction.Complete) {
			console.log('❌ Wrong action:', action)
			return { error: ClickError.ActionNotFound, error_note: 'Action not found' }
		}

		// 3. Transaction topish
		const transaction = await transactionModel.findById(merchant_trans_id)
		
		if (!transaction) {
			console.log('❌ Transaction not found')
			return { error: ClickError.TransactionNotFound, error_note: 'Transaction not found' }
		}

		console.log('Transaction state:', transaction.state, '- prepare_id:', transaction.prepare_id)

		// 4. Agar transaction Pending bo'lsa (Prepare kelmagan), auto-prepare qilamiz
		if (transaction.state === TransactionState.Pending || !transaction.prepare_id) {
			console.log('⚠️  Transaction not prepared, auto-preparing...')
			
			const prepareTime = new Date().getTime()
			const prepareIdValue = merchant_prepare_id || prepareTime
			
			await transactionModel.findByIdAndUpdate(merchant_trans_id, {
				state: TransactionState.Preparing,
				prepare_id: prepareIdValue,
				create_time: prepareTime,
			})
			
			console.log('✅ Auto-prepared, prepare_id:', prepareIdValue)
			
			// Telegram prepare notification
			try {
				const preparedTx = await transactionModel.findById(merchant_trans_id)
				const items = preparedTx.items || []
				await telegramService.sendPaymentPrepareNotification(preparedTx, items)
				console.log('📱 Telegram prepare sent')
			} catch (err) {
				console.error('Telegram error:', err.message)
			}
			
			// Update local transaction object
			transaction.state = TransactionState.Preparing
			transaction.prepare_id = prepareIdValue
		}

		// 5. Check if already paid
		const isAlreadyPaid = await transactionModel.findOne({ 
			_id: merchant_trans_id,
			state: TransactionState.Paid, 
			provider: 'click' 
		})
		
		if (isAlreadyPaid) {
			console.log('⚠️  Already paid')
			return {
				click_trans_id,
				merchant_trans_id,
				merchant_prepare_id: transaction.prepare_id,
				merchant_confirm_id: isAlreadyPaid.perform_time,
				error: ClickError.AlreadyPaid,
				error_note: 'Already paid'
			}
		}

		// 6. Check if canceled
		if (transaction.state === TransactionState.Canceled) {
			console.log('❌ Transaction canceled')
			return { error: ClickError.TransactionCanceled, error_note: 'Transaction canceled' }
		}

		const time = new Date().getTime()

		// 7. If Click.uz error
		if (parseInt(error) < 0) {
			console.log('❌ Click.uz error:', error)
			
			await transactionModel.findByIdAndUpdate(merchant_trans_id, { 
				state: TransactionState.Canceled, 
				cancel_time: time 
			})

			// Telegram canceled notification
			if (transaction) {
				try {
					await telegramService.sendPaymentCanceledNotification(transaction)
					console.log('📱 Telegram canceled sent')
				} catch (err) {
					console.error('Telegram error:', err.message)
				}
			}

			return { 
				click_trans_id,
				merchant_trans_id,
				merchant_prepare_id,
				merchant_confirm_id: time,
				error: ClickError.TransactionCanceled, 
				error_note: 'Transaction canceled' 
			}
		}

		// 7. Update to Paid
		await transactionModel.findByIdAndUpdate(merchant_trans_id, { 
			state: TransactionState.Paid, 
			perform_time: time 
		})

		console.log('✅ Payment confirmed')

		// Telegram success notification
		if (transaction) {
			try {
				const paidTransaction = await transactionModel.findById(merchant_trans_id)
				const items = paidTransaction.items || []
				await telegramService.sendPaymentNotification(paidTransaction, items)
				console.log('📱 Telegram success sent')
			} catch (err) {
				console.error('Telegram error:', err.message)
			}
		}

		return {
			click_trans_id,
			merchant_trans_id,
			merchant_prepare_id: transaction.prepare_id,
			merchant_confirm_id: time,
			error: ClickError.Success,
			error_note: 'Success',
		}
	}
}

module.exports = new ClickService()
