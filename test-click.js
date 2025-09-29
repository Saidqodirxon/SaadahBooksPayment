const md5 = require('md5')
const http = require('http')

// Test ma'lumotlari
const testData = {
    // Click parametrlari
    click_trans_id: 'test_' + Date.now(),
    service_id: process.env.CLICK_SERVICE_ID || '83510',
    merchant_trans_id: 'merchant_' + Date.now(),
    amount: 50000, // 500.00 so'm
    action: 0, // Prepare action
    sign_time: Math.floor(Date.now() / 1000),
}

// Secret key
const CLICK_SECRET_KEY = process.env.CLICK_SECRET_KEY || 'Bh04xdmSYr'

// HTTP request funksiyasi
function makeRequest(url, data) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data)
        
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: url,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        }
        
        const req = http.request(options, (res) => {
            let body = ''
            
            res.on('data', (chunk) => {
                body += chunk
            })
            
            res.on('end', () => {
                try {
                    const result = JSON.parse(body)
                    resolve(result)
                } catch (e) {
                    resolve({ error: 'Parse error', body })
                }
            })
        })
        
        req.on('error', (e) => {
            console.log('Request Error Details:', e)
            reject(e)
        })
        
        req.write(postData)
        req.end()
    })
}

// Signature yaratish funksiyasi
function generateSignature(data) {
    const { click_trans_id, service_id, merchant_trans_id, merchant_prepare_id, amount, action, sign_time } = data
    const prepareId = merchant_prepare_id || ''
    const signature = `${click_trans_id}${service_id}${CLICK_SECRET_KEY}${merchant_trans_id}${prepareId}${amount}${action}${sign_time}`
    return md5(signature)
}

// Test Prepare endpoint
async function testPrepare() {
    console.log('🔄 Testing PREPARE endpoint...')
    
    // Signature yaratish
    const sign_string = generateSignature(testData)
    
    const requestData = {
        ...testData,
        sign_string
    }
    
    console.log('📤 Request data:', requestData)
    console.log('🔐 Generated signature:', sign_string)
    
    try {
        const result = await makeRequest('/api/click/prepare', requestData)
        console.log('📥 Response:', result)
        
        if (result.error === 0) {
            console.log('✅ PREPARE test muvaffaqiyatli!')
            return result.merchant_prepare_id
        } else {
            console.log('❌ PREPARE test muvaffaqiyatsiz:', result.error_note)
            return null
        }
    } catch (error) {
        console.log('❌ Request error:', error.message)
        return null
    }
}

// Test Complete endpoint
async function testComplete(merchant_prepare_id) {
    console.log('\n🔄 Testing COMPLETE endpoint...')
    
    const completeData = {
        ...testData,
        action: 1, // Complete action
        merchant_prepare_id,
        error: 0 // Success
    }
    
    // Signature yaratish
    const sign_string = generateSignature(completeData)
    
    const requestData = {
        ...completeData,
        sign_string
    }
    
    console.log('📤 Request data:', requestData)
    console.log('🔐 Generated signature:', sign_string)
    
    try {
        const result = await makeRequest('/api/click/complete', requestData)
        console.log('📥 Response:', result)
        
        if (result.error === 0) {
            console.log('✅ COMPLETE test muvaffaqiyatli!')
        } else {
            console.log('❌ COMPLETE test muvaffaqiyatsiz:', result.error_note)
        }
    } catch (error) {
        console.log('❌ Request error:', error.message)
    }
}

// Test noto'g'ri signature
async function testInvalidSignature() {
    console.log('\n🔄 Testing invalid signature...')
    
    const requestData = {
        ...testData,
        sign_string: 'invalid_signature'
    }
    
    console.log('📤 Request data:', requestData)
    
    try {
        const result = await makeRequest('/api/click/prepare', requestData)
        console.log('📥 Response:', result)
        
        if (result.error === -1) {
            console.log('✅ Invalid signature test muvaffaqiyatli!')
        } else {
            console.log('❌ Invalid signature test kutilmagan natija')
        }
    } catch (error) {
        console.log('❌ Request error:', error.message)
    }
}

// Debug signature
function debugSignature() {
    console.log('\n🔍 Signature Debug Info:')
    console.log('Secret Key:', CLICK_SECRET_KEY)
    console.log('Test Data:', testData)
    
    const { click_trans_id, service_id, merchant_trans_id, amount, action, sign_time } = testData
    const signatureString = `${click_trans_id}${service_id}${CLICK_SECRET_KEY}${merchant_trans_id}${amount}${action}${sign_time}`
    const hash = md5(signatureString)
    
    console.log('Signature String:', signatureString)
    console.log('MD5 Hash:', hash)
}

// Barcha testlarni ishga tushirish
async function runTests() {
    console.log('🚀 Click.uz Integration testlarini boshlash...\n')
    
    // Debug signature
    debugSignature()
    
    // 1. Prepare test
    const merchant_prepare_id = await testPrepare()
    
    if (merchant_prepare_id) {
        // 2. Complete test
        await testComplete(merchant_prepare_id)
    }
    
    // 3. Invalid signature test
    await testInvalidSignature()
    
    console.log('\n🏁 Testlar tugadi!')
}

// Testlarni ishga tushirish
runTests().catch(console.error)