const md5 = require('md5')

const clickCheckToken = (data, signString) => {
	const { click_trans_id, service_id, merchant_trans_id, merchant_prepare_id, click_paydoc_id, amount, action, sign_time } = data
	const CLICK_SECRET_KEY = process.env.CLICK_SECRET_KEY
	
	// Complete (action=0) da click_paydoc_id ishlatiladi, Prepare (action=1) da merchant_prepare_id
	const prepareId = merchant_prepare_id || click_paydoc_id || ''
	
	const signature = `${click_trans_id}${service_id}${CLICK_SECRET_KEY}${merchant_trans_id}${prepareId}${amount}${action}${sign_time}`
	const signatureHash = md5(signature)
	
	// Debug logging
	console.log('🔐 Signature Check Details:')
	console.log('  click_trans_id:', click_trans_id)
	console.log('  service_id:', service_id)
	console.log('  merchant_trans_id:', merchant_trans_id)
	console.log('  prepareId (merchant_prepare_id || click_paydoc_id):', prepareId)
	console.log('  amount:', amount)
	console.log('  action:', action)
	console.log('  sign_time:', sign_time)
	console.log('  Generated signature:', signatureHash)
	console.log('  Expected signature:', signString)
	console.log('  Match:', signatureHash === signString ? '✅' : '❌')
	
	return signatureHash === signString
}

module.exports = clickCheckToken
