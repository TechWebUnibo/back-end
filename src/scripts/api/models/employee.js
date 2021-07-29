/**
* @file Customer schema
* @author Antonio Lopez, Davide Cristoni, Gledis Gila
*/

const mongoose = require('mongoose');

const employeeSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role:{
        type: String,
        enum: ['manager', 'administrator'],
        required: true
    }
});

module.exports = mongoose.model('Employee', employeeSchema);