require('dotenv').config()
const crypto = require('crypto')
const http = require('http')

// Click.uz test ma'lumotlari
const testPrepareData = {
	click_trans_id: '12345678',
	service_id: '83510',
	merchant_trans_id: '68deccb4d722e2c7e4088965', // Test qilish uchun OrderID
	amount: '1000',
	action: '1', // 1 = Prepare
	sign_time: new Date().toISOString().replace(/[-:]/g, '').split('.')[0],
}

const testCompleteData = {
	click_trans_id: '12345678',
	service_id: '83510',
	merchant_trans_id: '68deccb4d722e2c7e4088965', // Test qilish uchun OrderID
	merchant_prepare_id: Date.now().toString(),
	amount: '1000',
	action: '0', // 0 = Complete
	error: '0',
	sign_time: new Date().toISOString().replace(/[-:]/g, '').split('.')[0],
}

// Signature yaratish
function generateSignature(data, action) {
	const secretKey = process.env.CLICK_SECRET_KEY || 'Bh04xdmSYr'

	let signString
	if (action === 'prepare') {
		signString = `${data.click_trans_id}${data.service_id}${secretKey}${data.merchant_trans_id}${data.amount}${data.action}${data.sign_time}`
	} else {
		// complete
		signString = `${data.click_trans_id}${data.service_id}${secretKey}${data.merchant_trans_id}${data.merchant_prepare_id}${data.amount}${data.action}${data.sign_time}`
	}

	return crypto.createHash('md5').update(signString).digest('hex')
}

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

// Test Prepare
async function testPrepare() {
	console.log('\n📝 PREPARE TEST')
	console.log('=' .repeat(50))

	// Signature yaratish
	testPrepareData.sign_string = generateSignature(testPrepareData, 'prepare')

	console.log('\n📤 Request to /api/click/prepare:')
	console.log(JSON.stringify(testPrepareData, null, 2))

	try {
		const result = await makeRequest('/api/click/prepare', testPrepareData)

		console.log('\n📥 Response Status:', result.status)
		console.log('📥 Response Data:')
		console.log(JSON.stringify(result.data, null, 2))

		if (result.data.error === 0) {
			console.log('\n✅ PREPARE SUCCESS!')
			return result.data.merchant_prepare_id
		} else {
			console.log('\n❌ PREPARE FAILED!')
			console.log('Error:', result.data.error_note)
			return null
		}
	} catch (error) {
		console.log('\n❌ Request error:', error.message)
		return null
	}
}

// Test Complete
async function testComplete(prepareId) {
	console.log('\n📝 COMPLETE TEST')
	console.log('='.repeat(50))

	if (prepareId) {
		testCompleteData.merchant_prepare_id = prepareId.toString()
	}

	// Signature yaratish
	testCompleteData.sign_string = generateSignature(testCompleteData, 'complete')

	console.log('\n📤 Request to /api/click/complete:')
	console.log(JSON.stringify(testCompleteData, null, 2))

	try {
		const result = await makeRequest('/api/click/complete', testCompleteData)

		console.log('\n📥 Response Status:', result.status)
		console.log('📥 Response Data:')
		console.log(JSON.stringify(result.data, null, 2))

		if (result.data.error === 0) {
			console.log('\n✅ COMPLETE SUCCESS!')
			console.log('💡 Telegram guruhingizni tekshiring - to\'lov xabari kelgan bo\'lishi kerak!')
		} else {
			console.log('\n❌ COMPLETE FAILED!')
			console.log('Error:', result.data.error_note)
		}
	} catch (error) {
		console.log('\n❌ Request error:', error.message)
	}
}

// Barcha testlar
async function runTests() {
	console.log('\n🚀 CLICK WEBHOOK TESTLARINI BOSHLASH')
	console.log('='.repeat(50))
	console.log('⚠️  Server http://localhost:9999 da ishlab turganiga ishonch hosil qiling!')
	console.log('⚠️  Avval /api/payments/create orqali to\'lov yarating va merchant_trans_id ni oling!')

	// 1. Prepare test
	const prepareId = await testPrepare()

	// 2. Complete test (agar prepare muvaffaqiyatli bo'lsa)
	if (prepareId) {
		await new Promise(resolve => setTimeout(resolve, 1000)) // 1 soniya kutish
		await testComplete(prepareId)
	}

	console.log('\n🏁 TESTLAR TUGADI!')
}

runTests()
