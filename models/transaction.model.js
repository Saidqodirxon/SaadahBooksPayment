const { Schema, model } = require('mongoose')

const transactionSchema = new Schema(
	{
		id: { type: String },
		items: [
			{
				title: { type: String, required: true },
				qty: { type: Number, required: true, default: 1 },
				price: { type: Number, required: true },
				author: { type: String },
				image: { type: String },
				slug: { type: String },
				bookId: { type: String },
			},
		],
		customerName: { type: String, required: true },
		customerEmail: { type: String, required: true },
		customerPhone: { type: String, required: true },
		state: { type: Number }, // 0=pending, 1=preparing, 2=paid, -1=canceled
		amount: { type: Number },
		create_time: { type: Number, default: Date.now() },
		perform_time: { type: Number, default: 0 },
		cancel_time: { type: Number, default: 0 },
		reason: { type: Number, default: null },
		provider: { type: String, default: 'click' },
		prepare_id: { type: String },
	},
	{ timestamps: true }
)

module.exports = model('Transaction', transactionSchema)
