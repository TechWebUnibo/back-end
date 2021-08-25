/**
 * @file API for managing the rentals
 * @author Antonio Lopez, Davide Cristoni, Gledis Gila
 * @module products
 * @todo Add unique to email
 */

const express = require('express')
const mongoose = require('mongoose')
const Item = require('./models/item')
const support = require('./support')
const Customer = require('./models/customer')
const Employee = require('./models/employee')
const Rent = require('./models/rent')

const auth = require('./authentication')

var router = express.Router()

router.post('/', auth.verifyToken, async (req, res) => {
    let data = req.body
    data._id = new mongoose.Types.ObjectId()
    newRent = new Rent(data)
    // Check the consistancy of the price and the real availability of the products
    for (let item of newRent.products) {
        let occupied = await support.checkAvailability(item, newRent.start, newRent.end)
        // If some article is no more available notify the user
        if(occupied){
            return res.status(400).json({message: 'The products chosen are not available', error: {}})
        }
    }
    let items = await Promise.all(newRent.products.map(async (item) => { return await Item.findById(item) }))
    // Check if the price of the rent is changed from the initial showed to the user
    if (support.computePrice(items, newRent.start, newRent.end) != newRent.price){
        console.log(support.computePrice(items, newRent.start, newRent.end), newRent.price)
        return res.status(408).json({ message: 'The price is changed', error: {} })
    }
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
    console.log(req.query)
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

router.post('/:rentId', auth.verifyToken, (req, res) => {
    const rentId = req.params.rentId
    const newData = req.body
    Rent.findOneAndUpdate({ _id: rentId }, { $set: newData })
        .exec()
        .then((result) => {
            if (result) {
                res.status(200).json(result).json(result)
            } else {
                res.status(404).json({ message: 'Rent not found', error: {} })
            }
        })
        .catch((err) => {
            res.status(400).json({ message: 'Bad input parameter', error: err })
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
