/**
 * @file API for managing the customers
 * @author Antonio Lopez, Davide Cristoni, Gledis Gila
 * @module customers
 */
const express = require('express')
const mongoose = require('mongoose')
const Customer = require('./models/customer')

var router = express.Router()

/**
 * Add a new customer.
 * @param {object} data Data of the new customer
 */
router.post('/', (req, res) => {
    let data = req.body
    data._id = new mongoose.Types.ObjectId()
    const newCustomer = new Customer(data)
    newCustomer
        .save()
        .then((result) => {
            res.status(200).json({
                message: 'Customer created  ',
                customer: newCustomer,
            })
        })
        .catch((err) => res.status(400).json({ error: err }))
})

/**
 * Get all the customers.
 * @param {res} res Response object
 */
router.get('/', (req, res) => {
    Customer.find()
        .exec()
        .then((doc) => {
            res.status(200).json(doc)
        })
        .catch((err) => {
            res.status(500).json({ error: err })
        })
})

/**
 * Delete the customer with the corresponding id.
 * @param {object} res - Response object.
 * @param {String} id  - Customer id.
 */
router.delete('/:id', (req, res) => {
    const id = req.params.id
    Customer.deleteOne({ _id: id })
        .exec()
        .then((result) => {
            console.log(result)
            if (result.ok == 1 && result.deletedCount == 0) {
                res.status(404).json({
                    message: 'Customer not found',
                    error: {},
                })
            }
            res.status(200).json()
        })
        .catch((err) => {
            res.status(404).json({
                message: 'Customer not found',
                error: err,
            })
        })
})

module.exports = router
