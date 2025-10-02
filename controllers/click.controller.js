const clickService = require('../services/click.service')

class ClickController {
	async prepare(req, res, next) {
		try {
			const data = req.body
			const result = await clickService.prepare(data)
			res.set({ 'Content-Type': 'application/json' }).json(result)
		} catch (error) {
			console.error('Prepare error:', error)
			next(error)
		}
	}

	async complete(req, res, next) {
		try {
			const data = req.body
			const result = await clickService.complete(data)
			res.set({ 'Content-Type': 'application/json' }).json(result)
		} catch (error) {
			console.error('Complete error:', error)
			next(error)
		}
	}
}

module.exports = new ClickController()
