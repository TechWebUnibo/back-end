/**
 * @file Pruduct schema
 * @author Antonio Lopez, Davide Cristoni, Gledis Gila
 */

const mongoose = require('mongoose')
const opts = { toJSON: { virtuals: true } }
// Product schema used for single products and bundles.
// Custom validators are used for consistency
const itemSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: {
        type: String,
        required: true,
        unique: true,
    },
    type: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    condition: {
        type: String,
        enum: ['perfect', 'good', 'suitable', 'broken', 'not available'],
        required: true,
    },
})

module.exports = mongoose.model('Item', itemSchema)
