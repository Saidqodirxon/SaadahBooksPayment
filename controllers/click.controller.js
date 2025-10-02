const clickService = require('../services/click.service')

class ClickController {
	async prepare(req, res, next) {
		try {
			const data = req.body
			const action = parseInt(data.action)

			console.log('\n🔔 /prepare endpoint - Action:', action)

			let result

			// Click.uz /prepare URL'iga ham prepare (1) ham complete (0) yuborishi mumkin
			if (action === 1) {
				result = await clickService.prepare(data)
			} else if (action === 0) {
				console.log('⚠️  Complete request on /prepare, routing to complete...')
				result = await clickService.complete(data)
			} else {
				result = { error: -3, error_note: 'Action not found' }
			}

			res.set({ 'Content-Type': 'application/json' }).json(result)
		} catch (error) {
			console.error('Prepare endpoint error:', error)
			next(error)
		}
	}

	async complete(req, res, next) {
		try {
			const data = req.body
			const action = parseInt(data.action)

			console.log('\n🔔 /complete endpoint - Action:', action)

			let result

			// Click.uz /complete URL'iga ham complete (0) ham prepare (1) yuborishi mumkin
			if (action === 0) {
				result = await clickService.complete(data)
			} else if (action === 1) {
				console.log('⚠️  Prepare request on /complete, routing to prepare...')
				result = await clickService.prepare(data)
			} else {
				result = { error: -3, error_note: 'Action not found' }
			}

			res.set({ 'Content-Type': 'application/json' }).json(result)
		} catch (error) {
			console.error('Complete endpoint error:', error)
			next(error)
		}
	}
}

module.exports = new ClickController()
