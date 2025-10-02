const transactionModel = require('../models/transaction.model')
const telegramService = require('./telegram.service')
const clickCheckToken = require('../utils/click-check')
const { ClickError, ClickAction, TransactionState } = require('../enum/transaction.enum')

class ClickService {
	async prepare(data) {
		try {
			console.log('\n=== CLICK PREPARE WEBHOOK ===')
			console.log('Incoming data:', JSON.stringify(data, null, 2))

			const { click_trans_id, service_id, click_paydoc_id, merchant_trans_id, amount, action, sign_time, sign_string } = data

			// 1. Signature tekshirish
			const signatureData = { click_trans_id, service_id, merchant_trans_id, amount, action, sign_time }
			const checkSignature = clickCheckToken(signatureData, sign_string)
			
			console.log('Signature check:', checkSignature ? '✅ Valid' : '❌ Invalid')
			
			if (!checkSignature) {
				console.log('Response: SignFailed')
				return { error: ClickError.SignFailed, error_note: 'Invalid sign' }
			}

			// 2. Action tekshirish
			console.log('Action:', action, '(expected: 1 for Prepare)')
			
			if (parseInt(action) !== ClickAction.Prepare) {
				console.log('Response: ActionNotFound - Received action:', action)
				return { error: ClickError.ActionNotFound, error_note: 'Action not found' }
			}

			// 3. Transaction topish (Frontend yaratgan, merchant_trans_id = MongoDB _id)
			console.log('Looking for transaction with _id:', merchant_trans_id)
			
			const transaction = await transactionModel.findById(merchant_trans_id)
			
			if (!transaction) {
				console.log('Response: TransactionNotFound')
				return { error: ClickError.TransactionNotFound, error_note: 'Transaction not found' }
			}

			console.log('Transaction found:', {
				_id: transaction._id,
				amount: transaction.amount,
				state: transaction.state,
				customerName: transaction.customerName
			})

			// 4. Allaqachon to'langan bo'lsa
			if (transaction.state === TransactionState.Paid) {
				console.log('Response: AlreadyPaid')
				return { error: ClickError.AlreadyPaid, error_note: 'Already paid' }
			}

			// 5. Bekor qilingan bo'lsa
			if (transaction.state === TransactionState.Canceled) {
				console.log('Response: TransactionCanceled')
				return { error: ClickError.TransactionCanceled, error_note: 'Transaction canceled' }
			}

			// 6. Amount tekshirish
			console.log('Amount check:', `received=${amount}, expected=${transaction.amount}`)
			
			if (parseInt(amount) !== transaction.amount) {
				console.log('Response: InvalidAmount')
				return { error: ClickError.InvalidAmount, error_note: 'Invalid amount' }
			}

			const time = new Date().getTime()

			// 7. Transaction'ni yangilash - Click ma'lumotlarini qo'shish
			console.log('Updating transaction...')
			
			await transactionModel.findByIdAndUpdate(merchant_trans_id, {
				id: click_trans_id,
				state: TransactionState.Preparing,
				prepare_id: time,
			})

			console.log('Transaction updated successfully')

			// 8. Yangilangan transactionni olish
			const updatedTransaction = await transactionModel.findById(merchant_trans_id)

			// 9. Telegram botga xabar yuborish
			try {
				await telegramService.sendPaymentPrepareNotification(updatedTransaction, updatedTransaction.items || [])
				console.log('Telegram notification sent')
			} catch (error) {
				console.error('Telegram xabar yuborishda xatolik:', error.message)
			}

			const response = {
				click_trans_id,
				merchant_trans_id,
				merchant_prepare_id: time,
				error: ClickError.Success,
				error_note: 'Success',
			}

			console.log('Response:', JSON.stringify(response, null, 2))
			console.log('=== END PREPARE ===\n')

			return response
		} catch (error) {
			console.error('❌ Prepare error:', error)
			console.error('Stack:', error.stack)
			return { error: ClickError.BadRequest, error_note: 'Internal server error' }
		}
	}

	async complete(data) {
		try {
			console.log('\n=== CLICK COMPLETE WEBHOOK ===')
			console.log('Incoming data:', JSON.stringify(data, null, 2))

			const { 
				click_trans_id, 
				service_id, 
				click_paydoc_id, 
				merchant_trans_id, 
				merchant_prepare_id, 
				amount, 
				action, 
				sign_time, 
				sign_string, 
				error 
			} = data

			// merchant_prepare_id bo'lmasa, click_paydoc_id ishlatamiz (transaction topish uchun)
			const prepareId = merchant_prepare_id || click_paydoc_id

			// 1. Signature tekshirish
			// Signature'da faqat asosiy fieldlar ishlatiladi (merchant_prepare_id va click_paydoc_id YO'Q)
			const signatureData = { 
				click_trans_id, 
				service_id, 
				merchant_trans_id, 
				amount, 
				action, 
				sign_time 
			}
			const checkSignature = clickCheckToken(signatureData, sign_string)

			console.log('Signature check:', checkSignature ? '✅ Valid' : '❌ Invalid')

			if (!checkSignature) {
				console.log('Response: SignFailed')
				return { error: ClickError.SignFailed, error_note: 'Invalid sign' }
			}

			// 2. Action tekshirish
			console.log('Action:', action, '(expected: 0 for Complete)')

			if (parseInt(action) !== ClickAction.Complete) {
				console.log('Response: ActionNotFound - Received action:', action)
				return { error: ClickError.ActionNotFound, error_note: 'Action not found' }
			}

			// 3. Transaction topish (merchant_trans_id = MongoDB _id)
			console.log('Looking for transaction with _id:', merchant_trans_id)

			const transaction = await transactionModel.findById(merchant_trans_id)
			
			if (!transaction) {
				console.log('Response: TransactionNotFound')
				return { error: ClickError.TransactionNotFound, error_note: 'Transaction not found' }
			}

			console.log('Transaction found:', {
				_id: transaction._id,
				amount: transaction.amount,
				state: transaction.state,
				prepare_id: transaction.prepare_id
			})

			// 4. prepare_id tekshirish (agar bor bo'lsa)
			if (transaction.prepare_id && prepareId) {
				console.log('Prepare ID check:', `received=${prepareId}, expected=${transaction.prepare_id}`)

				// Agar prepare_id mos kelmasa, lekin transaction Preparing state'da bo'lsa, davom ettiramiz
				if (transaction.prepare_id !== parseInt(prepareId) && transaction.state !== TransactionState.Preparing) {
					console.log('Warning: Prepare ID mismatch but continuing...')
				}
			}

			// 5. Allaqachon to'langan bo'lsa
			if (transaction.state === TransactionState.Paid) {
				console.log('Response: AlreadyPaid')
				return { error: ClickError.AlreadyPaid, error_note: 'Already paid' }
			}

			// 6. Bekor qilingan bo'lsa
			if (transaction.state === TransactionState.Canceled) {
				console.log('Response: TransactionCanceled')
				return { error: ClickError.TransactionCanceled, error_note: 'Transaction canceled' }
			}

			const time = new Date().getTime()

			// 7. Agar Click.uz dan error kelsa - bekor qilish
			console.log('Click error code:', error)

			if (error < 0) {
				console.log('Payment canceled by Click.uz, error code:', error)

				await transactionModel.findByIdAndUpdate(merchant_trans_id, {
					state: TransactionState.Canceled,
					cancel_time: time,
				})

				// Telegram'ga bekor qilish xabari
				try {
					const canceledTransaction = await transactionModel.findById(merchant_trans_id)
					await telegramService.sendPaymentCanceledNotification(canceledTransaction)
					console.log('Telegram cancellation notification sent')
				} catch (err) {
					console.error('Telegram xabar yuborishda xatolik:', err)
				}

				const response = { 
					click_trans_id,
					merchant_trans_id,
					merchant_confirm_id: time,
					error: ClickError.TransactionCanceled, 
					error_note: 'Transaction canceled by user' 
				}

				console.log('Response:', JSON.stringify(response, null, 2))
				console.log('=== END COMPLETE ===\n')

				return response
			}

			// 8. To'lovni tasdiqlash
			console.log('Confirming payment...')

			await transactionModel.findByIdAndUpdate(merchant_trans_id, {
				state: TransactionState.Paid,
				perform_time: time,
			})

			console.log('Payment confirmed successfully')

			// 9. Telegram'ga muvaffaqiyatli to'lov xabari
			try {
				const paidTransaction = await transactionModel.findById(merchant_trans_id)
				const items = paidTransaction.items || []
				await telegramService.sendPaymentNotification(paidTransaction, items)
				console.log('Telegram success notification sent')
			} catch (err) {
				console.error('Telegram xabar yuborishda xatolik:', err)
			}

			const response = {
				click_trans_id,
				merchant_trans_id,
				merchant_confirm_id: time,
				error: ClickError.Success,
				error_note: 'Success',
			}

			console.log('Response:', JSON.stringify(response, null, 2))
			console.log('=== END COMPLETE ===\n')

			return response
		} catch (error) {
			console.error('❌ Complete error:', error)
			console.error('Stack:', error.stack)
			return { error: ClickError.BadRequest, error_note: 'Internal server error' }
		}
	}
}

module.exports = new ClickService()