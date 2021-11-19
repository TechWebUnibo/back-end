/**
 * @file Rent schema
 * @author Antonio Lopez, Davide Cristoni, Gledis Gila
 */

const mongoose = require('mongoose')
const Customer = require('./customer')
const Rent = require('./rent')

const notificationSchema = mongoose.Schema({
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

    rent: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Rentals',
        validate: {
            validator: (id) => {
                return Rent.exists({ _id: id })
            },
            message: 'Invalid rent',
        },
    },

    checked: {
        type: Boolean,
        default: false,
    },

    date: {
        type: Date
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

module.exports = mongoose.model('Notification', notificationSchema)
