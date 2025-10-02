require('dotenv').config()
const http = require('http')

// Frontend-dan kelgan test ma'lumotlari
const testPayment = {
	items: [
		{
			title: 'TEST',
			price: 1000,
			qty: 1,
			author: 'SaidQodiriy',
			bookId: 'TEST',
			image: 'https://hi0nlbpd2xsuaptf.public.blob.vercel-storage.com/uploads/fotimavazuhra-DodWA5l184nNITQ5Omcp5klOYkvmI0.webp',
			slug: 'TEST',
		},
	],
	customerName: 'Saidqodirxon Rahimov',
	customerEmail: 'rsaidqodirxon@gmai.com',
	customerPhone: '+998917505060',
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

		if (method === 'POST') {
			req.write(postData)
		}

		req.end()
	})
}

// Test
async function testPaymentUrl() {
	console.log('🧪 To\'lov URL yaratish testini boshlash...\n')

	console.log('📤 Request data:')
	console.log(JSON.stringify(testPayment, null, 2))
	console.log('\n')

	try {
		const result = await makeRequest('/api/payments/create', testPayment)

		console.log('📥 Response Status:', result.status)
		console.log('📥 Response Data:')
		console.log(JSON.stringify(result.data, null, 2))
		console.log('\n')

		if (result.data.click_url) {
			console.log('✅ SUCCESS! Click URL yaratildi:')
			console.log('🔗', result.data.click_url)
			console.log('\n')
			console.log('💡 Bu URL\'ni browserda ochib, to\'lovni test qilishingiz mumkin!')
		} else {
			console.log('❌ XATOLIK: click_url qaytmadi!')
			console.log('Response:', result.data)
		}
	} catch (error) {
		console.log('❌ Request error:', error.message)
	}
}

testPaymentUrl()
