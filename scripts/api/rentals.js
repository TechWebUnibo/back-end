/**
 * @file API for managing the rentals
 * @author Antonio Lopez, Davide Cristoni, Gledis Gila
 * @module products
 * @todo Add unique to email
 */

const express = require('express')
const mongoose = require('mongoose')
const Item = require('./models/item')
const Product = require('./models/product')
const Employee = require('./models/employee')
const Customer = require('./models/customer')
const support = require('./support')
const Invoice = require('./models/invoice')
const Rent = require('./models/rent')

const notify = require('./notify')

const auth = require('./authentication')

var router = express.Router()

router.post('/', auth.verifyToken, async (req, res) => {
    let data = req.body
    data._id = new mongoose.Types.ObjectId()

    // If the employee is not specified, pick one random
    if (typeof data.employee === 'undefined') {
        let employees = await Employee.find().lean()
        let min, empId
        if (employees.length === 0) {
            return res.status(500).json('No employee available')
        }
        empId = employees[0]._id
        min = await Rent.count({ employee: empId }).exec()
        for (const employee of employees) {
            let count = await Rent.count({ employee: employee._id }).exec()
            if (min > count) {
                min = count
                empId = employee._id
            }
        }
        data.employee = empId
    }

    newRent = new Rent(data)
    // Check the consistancy of the price and the real availability of the products
    // Check if the items are available
    if (
        await support.checkItems(newRent.products, newRent.start, newRent.end)
    ) {
        return res.status(400).json({
            message: 'The products chosen are not available',
            error: {},
        })
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
    newRent.state = 'not_started'
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

router.get('/', auth.verifyToken, async (req, res) => {
    let query = req.query
    const productName = req.query.productName
    const customerName = req.query.customerName
    const employeeName = req.query.employeeName
    const img = req.query.img
    delete query.productName
    delete query.customerName
    delete query.employeeName
    delete query.img
    if (query.start) query.start = { $gte: query.start }
    if (query.end) query.end = { $lte: query.end }

    try {
        let rents = await Rent.find(query).lean().exec()
        console.log(img)
        if(img){
            for(rent of rents){
                const product = await Product.findById(rent.productType)
                rent.img = product.img
            }
        }
        if (productName || customerName || employeeName) {
            for (let rent of rents) {
                if (customerName) {
                    let customer = await Customer.findOne({
                        _id: rent.customer,
                    })
                    rent.customer = customer.username
                }
                if (employeeName) {
                    let employee = await Employee.findOne({
                        _id: rent.employee,
                    })
                    rent.employee = employee.username
                }
                if (productName) {
                    for (const index in rent.products) {
                        let fullItem = await Item.findOne({
                            _id: rent.products[index],
                        })
                        let product = await Product.findOne({
                            _id: fullItem.type,
                        })
                        rent.products[index] = product.name
                    }
                    const fullProduct = await Product.findOne({
                        _id: rent.productType,
                    })
                    rent.productType = fullProduct.name
                }
            }
        }
        res.status(200).json(rents)
    } catch (err) {
        res.status(400).json({
            message: 'Bad query',
            error: err,
        })
    }
})

router.get('/:rentId', auth.verifyToken, async (req, res) => {
    try {
        const rentId = req.params.rentId
        let rent = await Rent.findById(rentId)
        if (rent) return res.status(200).json(rent)
        else return res.status(404).json({ message: 'Rent not found', error: {} })
    }
    catch (err) {
        res.status(500).json({ message: 'Server error', error: err })
    }
})

router.post('/:rentId', auth.verifyToken, async (req, res) => {
    const rentId = req.params.rentId
    const newData = req.body

    let rent = await Rent.findById(rentId)

    if (rent) {
        newData.start = newData.start ? newData.start : rent.start
        newData.end = newData.end ? newData.end : rent.end
        newData.products =
            newData.products && newData.products.length > 0
                ? newData.products
                : rent.products
        newData.price = newData.price ? newData.price : rent.price
        // If the rent is already in progress keep the state otherwise is not started
        newData.state = rent.state

        // Check if the items are available
        if (
            await support.checkItems(
                newData.products,
                newData.start,
                newData.end,
                rent._id
            )
        ) {
            return res.status(400).json({
                message: 'The products chosen are not available',
                error: {},
            })
        }
        let items = await Promise.all(
            newData.products.map(async (item) => {
                return await Item.findById(item)
            })
        )
        // Check if the price of the rent is changed from the initial showed to the user
        if (
            support.computePrice(items, newData.start, newData.end) !=
            newData.price
        ) {
            return res
                .status(408)
                .json({ message: 'The price is changed', error: {} })
        }

        Rent.findOneAndUpdate({ _id: rentId }, newData, {
            new: true,
            useFindAndModify: true,
        })
            .then((result) => {
                res.status(200).json({
                    rent: result,
                    message: 'Rent modified',
                })
            })
            .catch((err) => {
                res.status(400).json({
                    message: 'Bad input parameter',
                    error: err,
                })
            })
    } else {
        return res.status(400).json({ message: 'Rent not found', error: {} })
    }
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

router.post('/:id/start', auth.verifyToken, async (req, res) => {
    const id = req.params.id
    const rent = await Rent.findOne({ _id: id })
    if (rent) {
        // Check if is still possible to start the rent
        if (
            rent.state === 'not_started' &&
            Date.parse(rent.start) <= Date.now() &&
            Date.parse(support.addDays(rent.end, 1)) >= Date.now()
        ) {
            const result = await Rent.findOneAndUpdate(
                { _id: id },
                { state: 'in_progress' }
            )
            await notify.createNotification(
                result.customer,
                result._id,
                'in_progress'
            )
            res.status(200).json(result)
        } else {
            res.status(400).json({
                message: 'Rent already in progress or terminated',
                error: {},
            })
        }
    } else {
        res.status(404).json({ message: 'Rent not found', error: {} })
    }
})

router.post('/:id/terminate', auth.verifyToken, async (req, res) => {
    const id = req.params.id
    const rent = await Rent.findOne({ _id: id })
    const oneDay = 24 * 60 * 60 * 1000
    const damagedItem = 0.2
    const brokenItem = 0.8
    const delayedRent = 0.2

    // Penalities to be added to the price of the rent
    let penalities = 0
    if (rent && (rent.state === 'in_progress' || rent.state === 'delayed')) {
        let products = []
        let returnItems = req.body.products
        // Check if the item inserted are the same of the rental
        for (const item of rent.products) {
            console.log(item)
            if (!returnItems[item]) {
                return res.status(400).json({
                    message:
                        'The items inserted does not match with the rentals one',
                    error: {},
                })
            }
            if (
                (!returnItems[item].condition ||
                    returnItems[item].condition === 'broken') &&
                (!returnItems[item].start ||
                    !returnItems[item].end ||
                    Date.parse(returnItems[item].start) >
                        Date.parse(returnItems[item].end) ||
                    Date.parse(returnItems[item].start) !== Date.parse((new Date()).setHours(0,0,0,0)))
            ) {
                return res.status(400).json({
                    message:
                        'Bad input parameter, if the item is broken a period of reparation must be also indicated',
                    error: {},
                })
            }
        }
        for (const item of rent.products) {
            let result = await Item.findOneAndUpdate(
                { _id: item },
                { condition: returnItems[item].condition },
                { useFindAndModify: false }
            )
            // Apply an increase to the price if the items are returned in worse condition
            if (result.condition != returnItems[item].condition) {
                if (
                    returnItems[item].condition === 'broken' ||
                    returnItems[item].condition === 'not_available'
                ) {
                    penalities = penalities + result.price * brokenItem
                    await support.makeBroken(
                        [item],
                        returnItems[item].condition,
                        returnItems[item].start ||
                            new Date().setHours(0, 0, 0, 0),
                        returnItems[item].end
                    )
                } else {
                    penalities = penalities + result.price * damagedItem
                }
            }
        }

        if (rent.state === 'delayed') {
            const diffDays = Math.round(
                Math.abs((new Date() - rent.end) / oneDay)
            )
            penalities = penalities + diffDays * rent.price * delayedRent
        }

        await Rent.updateOne({ _id: id }, { state: 'terminated' })
        let invoice = new Invoice({
            _id: new mongoose.Types.ObjectId(),
            customer: rent.customer,
            employee: rent.employee,
            rent: rent._id,
            productType: rent.productType,
            price: rent.price + penalities,
            start: rent.start,
            end: rent.end,
            products: returnItems,
            notes: req.body.notes,
        })

        await notify.createNotification(rent.customer, rent._id, 'terminated')

        await invoice.save()

        return res.status(200).json(invoice)
    } else {
        if (!rent)
            return res.status(404).json({
                message: 'Rent not found',
                error: {},
            })
        else {
            return res.status(400).json({
                message: 'Rent already terminated or never started',
                error: {},
            })
        }
    }
})

module.exports = router
