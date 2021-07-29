/**
 * @file Customer schema
 * @author Antonio Lopez, Davide Cristoni, Gledis Gila
 */

const mongoose = require('mongoose')

const customerSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    username: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    address: {
        city: String,
        zip: Number,
        residence: String,
    },
    avatar: String,
})

module.exports = mongoose.model('Customer', customerSchema)
