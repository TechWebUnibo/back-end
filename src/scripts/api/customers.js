/**
* @file API for managing the customers
* @author Antonio Lopez, Davide Cristoni, Gledis Gila
* @module customers
*/
const mongoose = require('mongoose');
const Customer = require('./models/customer');


/**
* Add a new customer.
* @param {object} data Data of the new customer
*/
exports.addCustomer = function (data, res){
    data._id = new mongoose.Types.ObjectId();
    const newCustomer = new Customer(data);
    newCustomer.save().
    then(result => {
        res.status(200).json({
            message: 'Customer created  ',
            customer: newCustomer
        });
    })
    .catch(err => res.status(400).json({error: err}));
};


/**
* Get all the customers.
* @param {res} res Response object
*/
exports.getCustomers = function(res){
    Customer.find()
    .exec()
    .then(doc => {
        res.status(200).json(doc);
    })
    .catch(err => {
        res.status(500).json({error: err});
    });
}

