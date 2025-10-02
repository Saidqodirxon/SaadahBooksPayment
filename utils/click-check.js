const md5 = require('md5')

const clickCheckToken = (data, signString) => {
	const { click_trans_id, service_id, merchant_trans_id, amount, action, sign_time } = data
	const CLICK_SECRET_KEY = process.env.CLICK_SECRET_KEY
	
	// Click.uz signature formulasi (hamma action'lar uchun bir xil):
	// click_trans_id + service_id + secret_key + merchant_trans_id + amount + action + sign_time
	// merchant_prepare_id va click_paydoc_id ishlatilmaydi!
	
	const signature = `${click_trans_id}${service_id}${CLICK_SECRET_KEY}${merchant_trans_id}${amount}${action}${sign_time}`
	const signatureHash = md5(signature)
	
	// Debug logging
	console.log('🔐 Signature Check:')
	console.log('  click_trans_id:', click_trans_id)
	console.log('  service_id:', service_id)
	console.log('  secret_key:', CLICK_SECRET_KEY)
	console.log('  merchant_trans_id:', merchant_trans_id)
	console.log('  amount:', amount)
	console.log('  action:', action)
	console.log('  sign_time:', sign_time)
	console.log('  Signature string:', signature)
	console.log('  Generated MD5:', signatureHash)
	console.log('  Expected MD5:', signString)
	console.log('  Match:', signatureHash === signString ? '✅' : '❌')
	
	return signatureHash === signString
}

module.exports = clickCheckToken
