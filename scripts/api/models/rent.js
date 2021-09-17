/**
 * @file Rent schema
 * @author Antonio Lopez, Davide Cristoni, Gledis Gila
 */

const mongoose = require('mongoose')
const Customer = require('./customer')
const Employee = require('./employee')
const Product = require('./item')

const rentSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true,
        validate: {
            validator: (id) => {
                return Customer.exists({ _id: id })
            },
            message: 'Invalid customer',
        },
    },
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true,
        validate: {
            validator: (id) => {
                return Employee.exists({ _id: id })
            },
            message: 'Invalid employee',
        },
    },
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

    price: {
        type: Number,
        required: true,
    },

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

    state: {
        type: String,
        required: true,
        enum: [
            'not_started',
            'cancelled',
            'in_progress',
            'delayed',
            'terminated',
        ],
    },
})

// TODO - come tenere traccia del noleggio di un bundle?
// per i prodotti non c'e' problema si ricercano e si vedono se sono disponibili
// non si saprebbe pero' se tali oggetti sono stati presi con un bundle o meno

module.exports = mongoose.model('Rent', rentSchema)
