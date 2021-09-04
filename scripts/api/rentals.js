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
const Invoice = require('./models/invoice')
const Rent = require('./models/rent')

const auth = require('./authentication')

var router = express.Router()

router.post('/', auth.verifyToken, async (req, res) => {
    let data = req.body
    data._id = new mongoose.Types.ObjectId()
    newRent = new Rent(data)
    // Check the consistancy of the price and the real availability of the products
    for (let item of newRent.products) {
        let occupied = await support.checkAvailability(
            item,
            newRent.start,
            newRent.end
        )
        // If some article is no more available notify the user
        if (occupied) {
            return res.status(400).json({
                message: 'The products chosen are not available',
                error: {},
            })
        }
    }
    let items = await Promise.all(
        newRent.products.map(async (item) => {
            return await Item.findById(item)
        })
    )
    // Check if the price of the rent is changed from the initial showed to the user
    if (
        support.computePrice(items, newRent.start, newRent.end) != newRent.price
    ) {
        console.log(
            support.computePrice(items, newRent.start, newRent.end),
            newRent.price
        )
        return res
            .status(408)
            .json({ message: 'The price is changed', error: {} })
    }
    newRent.state = support.computeState(newRent.start, newRent.end)
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

router.post('/:id/terminate', auth.verifyToken, async (req, res) => {
    const id = req.params.id
    const rent = await Rent.findOne({ _id: id })
    const damagedItem = 0.2
    const brokenItem = 0.8
    // Penalities to be added to the price of the rent
    let penalities = 0
    if (rent && rent.state != 'terminated') {
        let products = []
        let returnItems = req.body.products
        // Check if the item inserted are the same of the rental
        for (const item of rent.products) {
            if (!returnItems[item]) {
                return res
                    .status(400)
                    .json({
                        message:
                            'The items inserted does not match with the rentals one',
                        error: {},
                    })
            }
            if ((!returnItems[item].condition || returnItems[item].condition === 'broken') && ((!returnItems[item].start || !returnItems[item].end) || Date.parse(returnItems[item].start) > Date.parse(returnItems[item].end))){
                return res
                    .status(400)
                    .json({
                        message:
                            'Bad input parameter, if the item is broken also a period of reparation must be indicated',
                        error: {},
                    })
            }
        }
        for (const item of rent.products) {
            let result = await Item.findOneAndUpdate(
                { _id: item },
                { condition: returnItems[item].condition }
            )
            // Apply an increase to the price if the items are returned in worse condition
            if (result.condition != returnItems[item]) {
                if (returnItems[item].condition == 'broken'){
                    penalities = penalities + result.price * brokenItem
                    await support.makeBroken(item, returnItems[item].start, returnItems[item].end)
                }
                else penalities = penalities + result.price * damagedItem
            }
        }

        await Rent.updateOne({ _id: id }, { state: 'terminated' })
        let invoice = new Invoice({
            _id: new mongoose.Types.ObjectId(),
            customer: rent.customer,
            employee: rent.employee,
            rent: rent._id,
            price: rent.price + penalities,
            start: rent.start,
            end: rent.end,
            products: returnItems,
            notes: req.body.notes,
        })

        await invoice.save()

        return res.status(200).json(invoice)
    } else {
        return res.status(404).json({ message: 'Rent not found or already terminated', error: {} })
    }
})

module.exports = router
