/**
 * @file Pruduct schema
 * @author Antonio Lopez, Davide Cristoni, Gledis Gila
 */

const mongoose = require('mongoose')

// Product schema used for single products and bundles.
// Custom validators are used for consistency
const productSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
        required: true,
    },
    img: {
        type: String,
    },
    products: {
        type: [mongoose.Schema.Types.ObjectId],
    },
})

module.exports = mongoose.model('Product', productSchema)
