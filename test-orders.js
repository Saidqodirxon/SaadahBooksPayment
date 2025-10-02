require('dotenv').config()
const http = require('http')

// Test buyurtma ma'lumotlari (Frontend-dan kelgan ko'rinishda)
const testOrder = {
	items: [
		{
			title: "O'zbek tili grammatikasi",
			price: 45000,
			qty: 2,
			author: 'A.Nurmonov',
			image: '/images/books/uzbek-grammar.jpg',
			slug: 'uzbek-tili-grammatikasi',
		},
		{
			title: 'Matematika asoslari',
			price: 30000,
			qty: 1,
			author: 'B.Karimov',
			image: '/images/books/math-basics.jpg',
			slug: 'matematika-asoslari',
		},
	],
	customerName: 'Said Qodirov',
	customerEmail: 'said@example.com',
	customerPhone: '+998901234567',
}

// HTTP request funksiyasi
function makeRequest(url, data, method = 'POST') {
	return new Promise((resolve, reject) => {
		const postData = JSON.stringify(data)

		const options = {
			hostname: 'localhost',
			port: 9999,
			path: url,
			method: method,
			headers: {
				'Content-Type': 'application/json',
				'Content-Length': Buffer.byteLength(postData),
			},
		}

		const req = http.request(options, res => {
			let body = ''

			res.on('data', chunk => {
				body += chunk
			})

			res.on('end', () => {
				try {
					const result = JSON.parse(body)
					resolve(result)
				} catch (e) {
					resolve({ error: 'Parse error', body, statusCode: res.statusCode })
				}
			})
		})

		req.on('error', e => {
			console.log('Request Error Details:', e)
			reject(e)
		})

		if (method === 'POST') {
			req.write(postData)
		}
		req.end()
	})
}

// 1. Buyurtma yaratish test
async function testCreateOrder() {
	console.log('🛍️  Buyurtma yaratish test...')
	console.log('📤 Request data:', JSON.stringify(testOrder, null, 2))

	try {
		const result = await makeRequest('/api/orders', testOrder)
		console.log('📥 Response:', JSON.stringify(result, null, 2))

		if (result.success) {
			console.log('✅ Buyurtma muvaffaqiyatli yaratildi!')
			console.log('💳 Transaction ID:', result.transaction._id)
			console.log('💰 Jami summa:', result.totalAmount.toLocaleString(), 'so\'m')
			console.log('📚 Kitoblar soni:', result.transaction.books.length)
			return result.transaction._id
		} else {
			console.log('❌ Buyurtma yaratishda xatolik:', result.error)
			return null
		}
	} catch (error) {
		console.log('❌ Request error:', error.message)
		return null
	}
}

// 2. Buyurtmani olish test
async function testGetOrder(orderId) {
	console.log('\n📋 Buyurtma ma\'lumotlarini olish test...')

	try {
		const result = await makeRequest(`/api/orders/${orderId}`, {}, 'GET')
		console.log('📥 Response:', JSON.stringify(result, null, 2))

		if (result._id) {
			console.log('✅ Buyurtma topildi!')
			console.log('👤 Mijoz:', result.customerName)
			console.log('📧 Email:', result.customerEmail)
			console.log('📱 Telefon:', result.customerPhone)
			console.log('📚 Kitoblar:')
			result.books.forEach((book, index) => {
				console.log(`   ${index + 1}. ${book.title} - ${book.price.toLocaleString()} so'm`)
			})
		} else {
			console.log('❌ Buyurtma topilmadi:', result.error)
		}
	} catch (error) {
		console.log('❌ Request error:', error.message)
	}
}

// 3. Statistika test
async function testStatistics() {
	console.log('\n📊 Statistika test...')

	try {
		const result = await makeRequest('/api/orders/statistics', {}, 'GET')
		console.log('📥 Response:', JSON.stringify(result, null, 2))

		if (result.totalRevenue !== undefined) {
			console.log('✅ Statistika olindi!')
			console.log('💰 Jami tushum:', result.totalRevenue.toLocaleString(), 'so\'m')
			console.log('📚 Sotilgan kitoblar:', result.totalBooks)
			console.log('👥 Xaridorlar:', result.totalCustomers)
			console.log('✅ Muvaffaqiyatli:', result.successfulPayments)
			console.log('❌ Bekor qilingan:', result.canceledPayments)
			console.log('⏳ Kutilmoqda:', result.pendingPayments)
		}
	} catch (error) {
		console.log('❌ Request error:', error.message)
	}
}

// 4. Noto'g'ri ma'lumotlar bilan test
async function testInvalidData() {
	console.log('\n❌ Noto\'g\'ri ma\'lumotlar bilan test...')

	const invalidOrder = {
		items: [
			{
				// title yo'q - xatolik bo'lishi kerak
				price: 10000,
				qty: 1,
			},
		],
		customerName: 'Test User',
		customerEmail: 'test@test.com',
		customerPhone: '+998901234567',
	}

	try {
		const result = await makeRequest('/api/orders', invalidOrder)
		console.log('📥 Response:', result)

		if (result.error) {
			console.log('✅ Xatolik to\'g\'ri qaytarildi:', result.error)
		} else {
			console.log('⚠️  Xatolik qaytmadi, lekin qaytishi kerak edi')
		}
	} catch (error) {
		console.log('❌ Request error:', error.message)
	}
}

// 5. Bo'sh savat bilan test
async function testEmptyCart() {
	console.log('\n🛒 Bo\'sh savat bilan test...')

	const emptyOrder = {
		items: [],
		customerName: 'Test User',
		customerEmail: 'test@test.com',
		customerPhone: '+998901234567',
	}

	try {
		const result = await makeRequest('/api/orders', emptyOrder)
		console.log('📥 Response:', result)

		if (result.error) {
			console.log('✅ Xatolik to\'g\'ri qaytarildi:', result.error)
		} else {
			console.log('⚠️  Xatolik qaytmadi, lekin qaytishi kerak edi')
		}
	} catch (error) {
		console.log('❌ Request error:', error.message)
	}
}

// Barcha testlarni ishga tushirish
async function runTests() {
	console.log('🚀 Backend API testlarini boshlash...\n')
	console.log('⚠️  Server http://localhost:9999 da ishlab turganiga ishonch hosil qiling!\n')

	// 1. Buyurtma yaratish
	const orderId = await testCreateOrder()

	if (orderId) {
		// 2. Buyurtmani olish
		await testGetOrder(orderId)
	}

	// 3. Statistika
	await testStatistics()

	// 4. Noto'g'ri ma'lumotlar
	await testInvalidData()

	// 5. Bo'sh savat
	await testEmptyCart()

	console.log('\n🏁 Testlar tugadi!')
	console.log('\n💡 Telegram guruhingizni tekshiring - xabar kelgan bo\'lishi kerak!')
}

// Testlarni ishga tushirish
runTests().catch(console.error)
