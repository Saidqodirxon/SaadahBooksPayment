const md5 = require('md5')
const https = require('https')

// Click.uz real test ma'lumotlari (sizning haqiqiy ma'lumotlaringiz bilan almashtiring)
const CLICK_CONFIG = {
    baseUrl: 'https://api.click.uz/v2/merchant/',
    serviceId: '83510', // Sizning service ID
    secretKey: 'Bh04xdmSYr', // Sizning secret key
    merchantId: '46304', // Sizning merchant ID
    userId: '64634' // Sizning user ID
}

// Test ma'lumotlari
const testTransaction = {
    click_trans_id: 'test_real_' + Date.now(),
    service_id: CLICK_CONFIG.serviceId,
    merchant_trans_id: 'order_' + Date.now(),
    amount: 25000, // 250.00 so'm
    action: 0, // Prepare
    sign_time: Math.floor(Date.now() / 1000)
}

// Click.uz signature yaratish
function generateClickSignature(data) {
    const { click_trans_id, service_id, merchant_trans_id, merchant_prepare_id, amount, action, sign_time } = data
    const prepareId = merchant_prepare_id || ''
    const signature = `${click_trans_id}${service_id}${CLICK_CONFIG.secretKey}${merchant_trans_id}${prepareId}${amount}${action}${sign_time}`
    return md5(signature)
}

// HTTPS so'rov yuborish
function makeClickRequest(endpoint, data) {
    return new Promise((resolve, reject) => {
        const postData = new URLSearchParams(data).toString()
        
        const options = {
            hostname: 'api.click.uz',
            port: 443,
            path: `/v2/merchant/${endpoint}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        }
        
        const req = https.request(options, (res) => {
            let body = ''
            
            res.on('data', (chunk) => {
                body += chunk
            })
            
            res.on('end', () => {
                try {
                    console.log('Raw Response:', body)
                    const result = JSON.parse(body)
                    resolve(result)
                } catch (e) {
                    resolve({ error: 'Parse error', body, statusCode: res.statusCode })
                }
            })
        })
        
        req.on('error', (e) => {
            console.log('Request Error:', e.message)
            reject(e)
        })
        
        req.write(postData)
        req.end()
    })
}

// Click.uz PREPARE testi
async function testClickPrepare() {
    console.log('🔄 Click.uz PREPARE so\'rovini yuborish...')
    
    const requestData = {
        ...testTransaction,
        sign_string: generateClickSignature(testTransaction)
    }
    
    console.log('📤 So\'rov ma\'lumotlari:', requestData)
    console.log('🌐 URL: https://api.click.uz/v2/merchant/prepare')
    
    try {
        const result = await makeClickRequest('prepare', requestData)
        console.log('📥 Javob:', result)
        
        if (result.error === 0) {
            console.log('✅ PREPARE muvaffaqiyatli!')
            return result.merchant_prepare_id
        } else {
            console.log('❌ PREPARE xatolik:', result.error_note)
            return null
        }
    } catch (error) {
        console.log('❌ So\'rov xatoligi:', error.message)
        return null
    }
}

// Click.uz COMPLETE testi
async function testClickComplete(merchant_prepare_id) {
    console.log('\n🔄 Click.uz COMPLETE so\'rovini yuborish...')
    
    const completeData = {
        ...testTransaction,
        action: 1, // Complete
        merchant_prepare_id,
        error: 0,
        sign_string: generateClickSignature({
            ...testTransaction,
            action: 1,
            merchant_prepare_id
        })
    }
    
    console.log('📤 So\'rov ma\'lumotlari:', completeData)
    console.log('🌐 URL: https://api.click.uz/v2/merchant/complete')
    
    try {
        const result = await makeClickRequest('complete', completeData)
        console.log('📥 Javob:', result)
        
        if (result.error === 0) {
            console.log('✅ COMPLETE muvaffaqiyatli!')
        } else {
            console.log('❌ COMPLETE xatolik:', result.error_note)
        }
    } catch (error) {
        console.log('❌ So\'rov xatoligi:', error.message)
    }
}

// Local server test
async function testLocalServer() {
    console.log('\n🏠 Local server test...')
    
    const localData = {
        ...testTransaction,
        sign_string: generateClickSignature(testTransaction)
    }
    
    console.log('📤 Local so\'rov:', localData)
    console.log('🌐 URL: http://localhost:5000/api/click/prepare')
    
    // Bu yerda sizning local serveringizga so'rov yuboriladi
    // (Avvalgi test_click.js faylidagi kod)
}

// Payment URL yaratish
function generatePaymentURL(amount, orderId) {
    const paymentData = {
        service_id: CLICK_CONFIG.serviceId,
        merchant_id: CLICK_CONFIG.merchantId,
        merchant_user_id: CLICK_CONFIG.userId,
        amount: amount,
        transaction_param: orderId
    }
    
    const url = `${CLICK_CONFIG.baseUrl}?` + new URLSearchParams(paymentData).toString()
    return url
}

// Main test function
async function runClickTests() {
    console.log('🚀 Click.uz Real Integration Test\n')
    
    console.log('⚙️ Konfiguratsiya:')
    console.log('Service ID:', CLICK_CONFIG.serviceId)
    console.log('Merchant ID:', CLICK_CONFIG.merchantId)
    console.log('Base URL:', CLICK_CONFIG.baseUrl)
    console.log()
    
    // 1. Payment URL yaratish
    const paymentUrl = generatePaymentURL(testTransaction.amount, testTransaction.merchant_trans_id)
    console.log('💳 To\'lov URL:', paymentUrl)
    console.log()
    
    // 2. Local server test
    await testLocalServer()
    
    // 3. Real Click.uz test (faqat real ma'lumotlar bilan)
    console.log('\n⚠️  Real Click.uz test uchun to\'g\'ri service_id va secret_key kerak!')
    console.log('📞 Click.uz bilan bog\'lanib, test ma\'lumotlarini oling.')
    
    // Agar real ma'lumotlar bo'lsa:
    // const prepareId = await testClickPrepare()
    // if (prepareId) {
    //     await testClickComplete(prepareId)
    // }
}

// Test ishga tushirish
runClickTests().catch(console.error)