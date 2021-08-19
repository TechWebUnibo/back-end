/**
 * @file API for managing the rentals
 * @author Antonio Lopez, Davide Cristoni, Gledis Gila
 * @module products
 * @todo Add unique to email
 */

const express = require('express')
const mongoose = require('mongoose')
const Product = require('./models/product')
const Customer = require('./models/customer')
const Employee = require('./models/employee')
const Rent = require('./models/rent')

const auth = require('./authentication')

var router = express.Router()

router.post('/', auth.verifyToken, (req, res) => {
    let data = req.body
    data._id = new mongoose.Types.ObjectId()
    newRent = new Rent(data)
    newRent
        .save()
        .then((result) => {
            res.status(200).json({
                rent: result,
                message: 'Rent created',
            })
        })
        .catch((err) => {
            res.status(400).json({ message: 'Bad input parameter', error: err })
        })
})

router.get('/', auth.verifyToken, (req, res) => {
    const query = req.query
    if (query.start) query.start = { $gte: query.start }
    if (query.end) query.end = { $lte: query.end }

    Rent.find(req.query)
        .exec()
        .then((result) => {
            res.status(200).json(result)
        })
        .catch((err) => {
            res.status(400).json({
                message: 'Bad query',
                error: err,
            })
        })
})

router.delete('/:rentId', auth.verifyToken, (req, res) => {
    let rentId = req.params.rentId
    Rent.findOneAndDelete({ _id: rentId })
        .exec()
        .then((result) => {
            if (result) {
                res.status(200).json({
                    message: 'Rental deleted',
                    rental: result,
                })
            } else {
                res.status(404).json({
                    message: 'Rental not found',
                    error: {},
                })
            }
        })
        .catch((err) => {
            res.status(404).json({
                message: 'Rental not found',
                error: err,
            })
        })
})

module.exports = router
