require('dotenv').config()
const telegramService = require('./services/telegram.service')

// Telegram bot test
async function testTelegramBot() {
	console.log('🤖 Telegram bot test...\n')

	try {
		// 1. Oddiy xabar test
		console.log('📤 Oddiy xabar yuborish...')
		await telegramService.sendMessage('✅ Test xabar: Bot ishlayapti!')
		console.log('✅ Xabar yuborildi!\n')

		// 2. To'lov prepare xabari test
		console.log('📤 Prepare xabar yuborish...')
		const testTransaction = {
			id: 'test_' + Date.now(),
			amount: 75000,
			create_time: Date.now(),
			provider: 'click',
		}

		const testBooks = [
			{ title: 'O\'zbek tili grammatikasi', price: 45000 },
			{ title: 'Matematika asoslari', price: 30000 },
		]

		await telegramService.sendPaymentPrepareNotification(testTransaction, testBooks)
		console.log('✅ Prepare xabar yuborildi!\n')

		// 3. To'lov muvaffaqiyatli xabari test
		console.log('📤 Success xabar yuborish...')
		await telegramService.sendPaymentNotification(testTransaction, testBooks)
		console.log('✅ Success xabar yuborildi!\n')

		// 4. To'lov bekor qilingan xabari test
		console.log('📤 Cancel xabar yuborish...')
		const canceledTransaction = {
			...testTransaction,
			cancel_time: Date.now(),
		}
		await telegramService.sendPaymentCanceledNotification(canceledTransaction)
		console.log('✅ Cancel xabar yuborildi!\n')

		// 5. Kunlik hisobot test
		console.log('📤 Kunlik hisobot yuborish...')
		const stats = {
			totalRevenue: 450000,
			totalBooks: 12,
			totalCustomers: 5,
			successfulPayments: 8,
			canceledPayments: 2,
		}
		await telegramService.sendDailyReport(stats)
		console.log('✅ Hisobot yuborildi!\n')

		console.log('🎉 Barcha testlar muvaffaqiyatli!')
	} catch (error) {
		console.error('❌ Xatolik:', error.message)
		if (error.response) {
			console.error('Response:', error.response.data)
		}
	}
}

testTelegramBot()
