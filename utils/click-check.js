const md5 = require('md5')

const clickCheckToken = (data, signString) => {
	const { click_trans_id, service_id, merchant_trans_id, merchant_prepare_id, click_paydoc_id, amount, action, sign_time } = data
	const CLICK_SECRET_KEY = process.env.CLICK_SECRET_KEY
	
	let signature
	let prepareId = ''
	
	// Action'ga qarab signature formulasi boshqacha
	if (parseInt(action) === 1) {
		// PREPARE: click_trans_id + service_id + secret_key + merchant_trans_id + amount + action + sign_time
		// Prepare'da merchant_prepare_id YO'Q!
		signature = `${click_trans_id}${service_id}${CLICK_SECRET_KEY}${merchant_trans_id}${amount}${action}${sign_time}`
		console.log('🔐 Signature Check (PREPARE):')
	} else if (parseInt(action) === 0) {
		// COMPLETE: click_trans_id + service_id + secret_key + merchant_trans_id + merchant_prepare_id + amount + action + sign_time
		// Complete'da merchant_prepare_id BOR!
		prepareId = merchant_prepare_id || click_paydoc_id || ''
		signature = `${click_trans_id}${service_id}${CLICK_SECRET_KEY}${merchant_trans_id}${prepareId}${amount}${action}${sign_time}`
		console.log('🔐 Signature Check (COMPLETE):')
	} else {
		signature = `${click_trans_id}${service_id}${CLICK_SECRET_KEY}${merchant_trans_id}${amount}${action}${sign_time}`
		console.log('🔐 Signature Check (UNKNOWN ACTION):')
	}
	
	const signatureHash = md5(signature)
	
	// Debug logging
	console.log('  click_trans_id:', click_trans_id)
	console.log('  service_id:', service_id)
	console.log('  merchant_trans_id:', merchant_trans_id)
	if (parseInt(action) === 0) {
		console.log('  prepareId (merchant_prepare_id || click_paydoc_id):', prepareId)
	}
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
