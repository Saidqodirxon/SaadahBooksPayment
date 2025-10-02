require('dotenv').config()
const crypto = require('crypto')
const http = require('http')

const secretKey = process.env.CLICK_SECRET_KEY || 'Bh04xdmSYr'

// HTTP request funksiyasi
function makeRequest(url, data) {
	return new Promise((resolve, reject) => {
		const postData = JSON.stringify(data)

		const options = {
			hostname: 'localhost',
			port: 9999,
			path: url,
			method: 'POST',
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
					const parsed = JSON.parse(body)
					resolve({ status: res.statusCode, data: parsed })
				} catch (e) {
					resolve({ status: res.statusCode, data: body })
				}
			})
		})

		req.on('error', err => {
			reject(err)
		})

		req.write(postData)
		req.end()
	})
}

// Signature yaratish (Prepare uchun)
function generatePrepareSignature(data) {
	const signString = `${data.click_trans_id}${data.service_id}${secretKey}${data.merchant_trans_id}${data.amount}${data.action}${data.sign_time}`
	return crypto.createHash('md5').update(signString).digest('hex')
}

// Signature yaratish (Complete uchun)
function generateCompleteSignature(data) {
	const signString = `${data.click_trans_id}${data.service_id}${secretKey}${data.merchant_trans_id}${data.merchant_prepare_id}${data.amount}${data.action}${data.sign_time}`
	return crypto.createHash('md5').update(signString).digest('hex')
}

async function fullTest() {
	console.log('\n' + '='.repeat(60))
	console.log('🚀 CLICK.UZ TO\'LIQ INTEGRATION TEST')
	console.log('='.repeat(60))

	// ============================================
	// QADAM 1: To'lov yaratish
	// ============================================
	console.log('\n📝 QADAM 1: To\'lov yaratish...')
	console.log('-'.repeat(60))

	const paymentData = {
		items: [
			{
				title: 'O\'zbek tili grammatikasi',
				price: 45000,
				qty: 2,
				author: 'A.Nurmonov',
				image: '/images/book1.jpg',
				slug: 'uzbek-tili',
			},
			{
				title: 'Matematika asoslari',
				price: 30000,
				qty: 1,
				author: 'B.Karimov',
				image: '/images/book2.jpg',
				slug: 'matematika',
			},
		],
		customerName: 'Test User',
		customerEmail: 'test@example.com',
		customerPhone: '+998901234567',
	}

	let orderId, totalAmount

	try {
		const paymentResult = await makeRequest('/api/payments/create', paymentData)

		if (paymentResult.status !== 201) {
			console.log('❌ To\'lov yaratish xato!')
			console.log('Status:', paymentResult.status)
			console.log('Data:', paymentResult.data)
			return
		}

		orderId = paymentResult.data.orderId
		totalAmount = paymentResult.data.amount

		console.log('✅ To\'lov muvaffaqiyatli yaratildi!')
		console.log('   Order ID:', orderId)
		console.log('   Amount:', totalAmount.toLocaleString(), 'so\'m')
		console.log('   Click URL:', paymentResult.data.click_url)
	} catch (error) {
		console.log('❌ To\'lov yaratish xato:', error.message)
		return
	}

	// 2 soniya kutish
	await new Promise(resolve => setTimeout(resolve, 2000))

	// ============================================
	// QADAM 2: Prepare webhook
	// ============================================
	console.log('\n📝 QADAM 2: Prepare webhook...')
	console.log('-'.repeat(60))

	const prepareData = {
		click_trans_id: String(Date.now()),
		service_id: '83510',
		merchant_trans_id: orderId,
		amount: String(totalAmount),
		action: '1', // 1 = Prepare
		sign_time: new Date().toISOString().replace(/[-:]/g, '').split('.')[0],
	}

	prepareData.sign_string = generatePrepareSignature(prepareData)

	console.log('📤 Prepare Request:')
	console.log('   click_trans_id:', prepareData.click_trans_id)
	console.log('   merchant_trans_id:', prepareData.merchant_trans_id)
	console.log('   amount:', prepareData.amount)

	let prepareId

	try {
		const prepareResult = await makeRequest('/api/click/prepare', prepareData)

		console.log('\n📥 Prepare Response:')
		console.log('   Status:', prepareResult.status)
		console.log('   Error:', prepareResult.data.error, '-', prepareResult.data.error_note)

		if (prepareResult.data.error !== 0) {
			console.log('❌ Prepare xato!')
			console.log('   Full response:', JSON.stringify(prepareResult.data, null, 2))
			return
		}

		prepareId = prepareResult.data.merchant_prepare_id
		console.log('✅ Prepare muvaffaqiyatli!')
		console.log('   Prepare ID:', prepareId)
	} catch (error) {
		console.log('❌ Prepare request xato:', error.message)
		return
	}

	// 2 soniya kutish
	await new Promise(resolve => setTimeout(resolve, 2000))

	// ============================================
	// QADAM 3: Complete webhook
	// ============================================
	console.log('\n📝 QADAM 3: Complete webhook...')
	console.log('-'.repeat(60))

	const completeData = {
		click_trans_id: prepareData.click_trans_id,
		service_id: '83510',
		merchant_trans_id: orderId,
		merchant_prepare_id: String(prepareId),
		amount: String(totalAmount),
		action: '0', // 0 = Complete
		error: '0',
		sign_time: new Date().toISOString().replace(/[-:]/g, '').split('.')[0],
	}

	completeData.sign_string = generateCompleteSignature(completeData)

	console.log('📤 Complete Request:')
	console.log('   click_trans_id:', completeData.click_trans_id)
	console.log('   merchant_trans_id:', completeData.merchant_trans_id)
	console.log('   merchant_prepare_id:', completeData.merchant_prepare_id)

	try {
		const completeResult = await makeRequest('/api/click/complete', completeData)

		console.log('\n📥 Complete Response:')
		console.log('   Status:', completeResult.status)
		console.log('   Error:', completeResult.data.error, '-', completeResult.data.error_note)

		if (completeResult.data.error !== 0) {
			console.log('❌ Complete xato!')
			console.log('   Full response:', JSON.stringify(completeResult.data, null, 2))
			return
		}

		console.log('✅ Complete muvaffaqiyatli!')
		console.log('   Confirm ID:', completeResult.data.merchant_confirm_id)
	} catch (error) {
		console.log('❌ Complete request xato:', error.message)
		return
	}

	// ============================================
	// QADAM 4: Status tekshirish
	// ============================================
	console.log('\n📝 QADAM 4: Status tekshirish...')
	console.log('-'.repeat(60))

	try {
		const statusResult = await new Promise((resolve, reject) => {
			const options = {
				hostname: 'localhost',
				port: 9999,
				path: `/api/payments/${orderId}`,
				method: 'GET',
			}

			const req = http.request(options, res => {
				let body = ''
				res.on('data', chunk => {
					body += chunk
				})
				res.on('end', () => {
					resolve({ status: res.statusCode, data: JSON.parse(body) })
				})
			})

			req.on('error', reject)
			req.end()
		})

		console.log('📥 Transaction Status:')
		console.log('   State:', statusResult.data.state, getStateName(statusResult.data.state))
		console.log('   Amount:', statusResult.data.amount.toLocaleString(), 'so\'m')
		console.log('   Customer:', statusResult.data.customerName)
		console.log('   Items:', statusResult.data.items.length, 'ta kitob')

		if (statusResult.data.state === 2) {
			console.log('\n🎉 TO\'LOV MUVAFFAQIYATLI YAKUNLANDI!')
		}
	} catch (error) {
		console.log('❌ Status tekshirish xato:', error.message)
	}

	// ============================================
	// YAKUNIY NATIJA
	// ============================================
	console.log('\n' + '='.repeat(60))
	console.log('✅ BARCHA TESTLAR MUVAFFAQIYATLI YAKUNLANDI!')
	console.log('='.repeat(60))
	console.log('\n💡 Eslatma:')
	console.log('   - Telegram guruhingizni tekshiring')
	console.log('   - 2 ta xabar kelgan bo\'lishi kerak:')
	console.log('     1) ⏳ Prepare xabari')
	console.log('     2) 🎉 To\'lov muvaffaqiyatli xabari')
	console.log('\n')
}

function getStateName(state) {
	const names = {
		2: '✅ (Paid)',
		1: '⏳ (Preparing)',
		0: '⏰ (Pending)',
		'-1': '❌ (Canceled)',
		'-2': '❌ (Paid + Canceled)',
	}
	return names[state] || '❓ (Unknown)'
}

// Testni ishga tushirish
fullTest().catch(err => {
	console.error('\n❌ Fatal error:', err)
	process.exit(1)
})
