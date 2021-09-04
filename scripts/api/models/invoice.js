/**
 * @file Invoice schema
 * @author Antonio Lopez, Davide Cristoni, Gledis Gila
 */

const mongoose = require('mongoose')
const Customer = require('./customer')
const Employee = require('./employee')

const invoiceSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,

    rent: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Rentals',
    },

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

    products: {
        type: Map,
        of: Object,
    },

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

    notes: {
        type: String,
        required: false,
    },
})

module.exports = mongoose.model('Invoice', invoiceSchema)
