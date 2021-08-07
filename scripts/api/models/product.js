/**
 * @file Pruduct schema
 * @author Antonio Lopez, Davide Cristoni, Gledis Gila
 */

const mongoose = require('mongoose')
const opts = { toJSON: { virtuals: true } };
// Product schema used for single products and bundles.
// Custom validators are used for consistency
const productSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: {
        type: String,
        required: true,
        unique: true
    },
    type: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },

    img: {
        type: String,
        required: true
    },

    condition: {
        type: String,
        enum: ['perfect', 'good', 'suitable' ,'broken','not available'],
        required: function () {
            return (this.type !== 'bundle')
        },
        validate: {
            validator: () => {
                return !(typeof this.condition === undefined && this.type === 'bundle')
            }
        }    
    },
    products: {
        type: [String],
        required: function () {
            return this.type == 'bundle'
        },
        validate: {
            // Check if it is a bundle
            validator: () => {
                return (typeof this.products !== undefined && this.type !== 'bundle')
            }
        }
    }
})

/*
productSchema.statics.checkAvailabiliyt = async function(){
    if (this.type == 'bundle'){
        for (const product in this.products) {
            const docs = await Product.find({ type: product, condition: { $ne: 'not available' } })
            if (docs.length === 0)
            return false
        }
        return true
    }
    else{
        return this.condition !== 'not available'
    }
}*/

Product = mongoose.model('Product', productSchema)
module.exports = Product
