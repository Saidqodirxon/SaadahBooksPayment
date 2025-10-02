const { Schema, model } = require('mongoose')

const productSchema = new Schema(
	{
		title: { type: String, required: true },
		price: { type: Number, required: true },
		author: { type: String },
		description: { type: String },
		image: { type: String },
		category: { type: String },
		isbn: { type: String },
		pages: { type: Number },
		language: { type: String, default: 'uz' },
		inStock: { type: Boolean, default: true },
	},
	{ timestamps: true }
)

module.exports = model('Product', productSchema)
