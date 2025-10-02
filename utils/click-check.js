const md5 = require('md5')

const clickCheckToken = (data, signString) => {
	const { click_trans_id, service_id, merchant_trans_id, merchant_prepare_id, amount, action, sign_time } = data
	const CLICK_SECRET_KEY = process.env.CLICK_SECRET_KEY
	
	let signature
	
	// Action'ga qarab signature formulasi:
	if (parseInt(action) === 1) {
		// PREPARE (action=1): merchant_prepare_id YO'Q
		signature = `${click_trans_id}${service_id}${CLICK_SECRET_KEY}${merchant_trans_id}${amount}${action}${sign_time}`
		console.log('🔐 Signature Check (PREPARE - no merchant_prepare_id):')
	} else if (parseInt(action) === 0) {
		// COMPLETE (action=0): merchant_prepare_id BOR
		const prepareId = merchant_prepare_id || ''
		signature = `${click_trans_id}${service_id}${CLICK_SECRET_KEY}${merchant_trans_id}${prepareId}${amount}${action}${sign_time}`
		console.log('🔐 Signature Check (COMPLETE - with merchant_prepare_id):')
	} else {
		// Unknown action
		signature = `${click_trans_id}${service_id}${CLICK_SECRET_KEY}${merchant_trans_id}${amount}${action}${sign_time}`
		console.log('🔐 Signature Check (UNKNOWN ACTION):')
	}
	
	const signatureHash = md5(signature)
	
	// Debug logging
	console.log('  click_trans_id:', click_trans_id)
	console.log('  service_id:', service_id)
	console.log('  secret_key:', CLICK_SECRET_KEY)
	console.log('  merchant_trans_id:', merchant_trans_id)
	if (parseInt(action) === 0 && merchant_prepare_id) {
		console.log('  merchant_prepare_id:', merchant_prepare_id)
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
