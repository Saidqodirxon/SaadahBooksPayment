const axios = require('axios')

class TelegramService {
	constructor() {
		this.botToken = process.env.TELEGRAM_BOT_TOKEN
		this.chatId = process.env.TELEGRAM_CHAT_ID
		this.baseUrl = `https://api.telegram.org/bot${this.botToken}`
	}

	// Xabar yuborish
	async sendMessage(text) {
		try {
			const response = await axios.post(`${this.baseUrl}/sendMessage`, {
				chat_id: this.chatId,
				text: text,
				parse_mode: 'HTML',
			})
			return response.data
		} catch (error) {
			console.error('Telegram xabar yuborishda xatolik:', error.message)
			throw error
		}
	}

	// To'lov muvaffaqiyatli bo'lganda xabar
	async sendPaymentNotification(transaction, items) {
		const itemsList = items
			.map(
				(item, i) =>
					`${i + 1}. ${item.title}${item.author ? ` (${item.author})` : ''}\n   ${item.qty} ta × ${item.price.toLocaleString()} = ${(item.qty * item.price).toLocaleString()} so'm`
			)
			.join('\n')

		const totalItems = items.reduce((sum, item) => sum + item.qty, 0)

		const message = `
🎉 <b>Yangi to'lov muvaffaqiyatli!</b>

💳 <b>Transaction ID:</b> ${transaction.id || transaction._id}
💰 <b>Summa:</b> ${transaction.amount.toLocaleString()} so'm
📅 <b>Sana:</b> ${new Date(transaction.create_time).toLocaleString('uz-UZ')}

� <b>Mijoz:</b> ${transaction.customerName}
📧 <b>Email:</b> ${transaction.customerEmail}
📱 <b>Telefon:</b> ${transaction.customerPhone}

�📚 <b>Sotib olingan kitoblar (${totalItems} ta):</b>
${itemsList}

✅ <b>Holat:</b> To'landi
🔗 <b>Provider:</b> ${transaction.provider}
		`

		return await this.sendMessage(message)
	}

	// To'lov tayyorlanganda xabar
	async sendPaymentPrepareNotification(transaction, items) {
		const itemsList = items
			.map(
				(item, i) =>
					`${i + 1}. ${item.title}${item.author ? ` (${item.author})` : ''}\n   ${item.qty} ta × ${item.price.toLocaleString()} = ${(item.qty * item.price).toLocaleString()} so'm`
			)
			.join('\n')

		const totalItems = items.reduce((sum, item) => sum + item.qty, 0)

		const message = `
⏳ <b>Yangi to'lov tayyorlanmoqda...</b>

💳 <b>Transaction ID:</b> ${transaction.id || transaction._id}
💰 <b>Summa:</b> ${transaction.amount.toLocaleString()} so'm

👤 <b>Mijoz:</b> ${transaction.customerName}
📧 <b>Email:</b> ${transaction.customerEmail}
📱 <b>Telefon:</b> ${transaction.customerPhone}

📚 <b>Tanlangan kitoblar (${totalItems} ta):</b>
${itemsList}

⏰ <b>Kutilmoqda...</b>
		`

		return await this.sendMessage(message)
	}

	// To'lov bekor qilinganda xabar
	async sendPaymentCanceledNotification(transaction) {
		const message = `
❌ <b>To'lov bekor qilindi</b>

💳 <b>Transaction ID:</b> ${transaction.id}
💰 <b>Summa:</b> ${transaction.amount.toLocaleString()} so'm
📅 <b>Bekor qilingan sana:</b> ${new Date(transaction.cancel_time).toLocaleString('uz-UZ')}

🔴 <b>Holat:</b> Bekor qilindi
		`

		return await this.sendMessage(message)
	}

	// Order yaratilganda xabar
	async sendOrderCreatedNotification(transaction, items) {
		const itemsList = items
			.map(
				(item, i) =>
					`${i + 1}. ${item.title}${item.author ? ` (${item.author})` : ''}\n   ${item.qty} ta × ${item.price.toLocaleString()} = ${(item.qty * item.price).toLocaleString()} so'm`
			)
			.join('\n')

		const totalItems = items.reduce((sum, item) => sum + item.qty, 0)

		const message = `
🛒 <b>Yangi buyurtma yaratildi!</b>

💳 <b>Order ID:</b> ${transaction._id}
💰 <b>Summa:</b> ${transaction.amount.toLocaleString()} so'm

👤 <b>Mijoz:</b> ${transaction.customerName}
📧 <b>Email:</b> ${transaction.customerEmail}
📱 <b>Telefon:</b> ${transaction.customerPhone}

📚 <b>Tanlangan kitoblar (${totalItems} ta):</b>
${itemsList}

⏰ <b>To'lov kutilmoqda...</b>
🔗 <b>Provider:</b> Click.uz
		`

		return await this.sendMessage(message)
	}

	// Kunlik hisobot
	async sendDailyReport(stats) {
		const message = `
📊 <b>Kunlik hisobot</b>

💰 <b>Jami tushum:</b> ${stats.totalRevenue.toLocaleString()} so'm
📦 <b>Sotilgan kitoblar:</b> ${stats.totalBooks} ta
👥 <b>Xaridorlar:</b> ${stats.totalCustomers} ta
✅ <b>Muvaffaqiyatli to'lovlar:</b> ${stats.successfulPayments} ta
❌ <b>Bekor qilingan:</b> ${stats.canceledPayments} ta

📅 <b>Sana:</b> ${new Date().toLocaleDateString('uz-UZ')}
		`

		return await this.sendMessage(message)
	}
}

module.exports = new TelegramService()
