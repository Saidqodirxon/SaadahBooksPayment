const clickService = require('../services/click.service')

class ClickController {
	// Yagona webhook endpoint - action'ga qarab prepare yoki complete
	async webhook(req, res, next) {
		try {
			const data = req.body
			const action = parseInt(data.action)

			console.log('\n🔔 Click.uz Webhook received')
			console.log('Action:', action, action === 1 ? '(Prepare)' : action === 0 ? '(Complete)' : '(Unknown)')

			let result

			// Action: 1 = Prepare, 0 = Complete
			if (action === 1) {
				result = await clickService.prepare(data)
			} else if (action === 0) {
				result = await clickService.complete(data)
			} else {
				result = {
					error: -3,
					error_note: 'Action not found'
				}
			}

			res.set({ 'Content-Type': 'application/json' }).json(result)
		} catch (error) {
			console.error('❌ Webhook error:', error)
			next(error)
		}
	}

	// Eski endpoint'lar - backward compatibility uchun
	async prepare(req, res, next) {
		try {
			const data = req.body
			const action = parseInt(data.action)

			console.log('\n🔔 /prepare endpoint - Action:', action)

			let result

			// Click.uz /prepare URL'iga ham prepare ham complete yuboradi
			// Action'ga qarab to'g'ri metodga yo'naltiramiz
			if (action === 1) {
				// Prepare
				result = await clickService.prepare(data)
			} else if (action === 0) {
				// Complete
				console.log('⚠️  Complete request received on /prepare endpoint, routing to complete...')
				result = await clickService.complete(data)
			} else {
				result = {
					error: -3,
					error_note: 'Action not found'
				}
			}

			res.set({ 'Content-Type': 'application/json' }).json(result)
		} catch (error) {
			console.error('❌ Prepare endpoint error:', error)
			next(error)
		}
	}

	async complete(req, res, next) {
		try {
			const data = req.body
			const action = parseInt(data.action)

			console.log('\n🔔 /complete endpoint - Action:', action)

			let result

			// Action'ga qarab to'g'ri metodga yo'naltiramiz
			if (action === 0) {
				// Complete
				result = await clickService.complete(data)
			} else if (action === 1) {
				// Prepare
				console.log('⚠️  Prepare request received on /complete endpoint, routing to prepare...')
				result = await clickService.prepare(data)
			} else {
				result = {
					error: -3,
					error_note: 'Action not found'
				}
			}

			res.set({ 'Content-Type': 'application/json' }).json(result)
		} catch (error) {
			console.error('❌ Complete endpoint error:', error)
			next(error)
		}
	}
}

module.exports = new ClickController()
