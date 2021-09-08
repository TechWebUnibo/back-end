/**
 * @file Rent schema
 * @author Antonio Lopez, Davide Cristoni, Gledis Gila
 */

const mongoose = require('mongoose')
const Product = require('./item')

const reparationSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,

    products: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Item',
            required: true,
            validate: {
                validator: (id) => {
                    return Product.exists({ _id: id })
                },
                message: 'Invalid product',
            },
        },
    ],

    start: {
        type: Date,
        required: true,
    },
    end: {
        type: Date,
        required: true,
        validate: {
            validator: function () {
                return this.start <= this.end
            },
            message: 'Start should be before the end of the rent',
        },
    },
})

// TODO - come tenere traccia del noleggio di un bundle?
// per i prodotti non c'e' problema si ricercano e si vedono se sono disponibili
// non si saprebbe pero' se tali oggetti sono stati presi con un bundle o meno

module.exports = mongoose.model('Reparation', reparationSchema)
