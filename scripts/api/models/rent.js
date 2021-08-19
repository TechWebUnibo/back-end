/**
 * @file Rent schema
 * @author Antonio Lopez, Davide Cristoni, Gledis Gila
 */

const mongoose = require('mongoose')
const Customer = require('./customer')
const Employee = require('./employee')
const Product = require('./product')

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
            ref: 'Product',
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
                return this.start < this.end
            },
            message: 'Start should be before the end of the rent',
        },
    },
})

module.exports = mongoose.model('Rent', rentSchema)
