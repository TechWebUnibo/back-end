/**
 * @file API for managing the invoices
 * @author Antonio Lopez, Davide Cristoni, Gledis Gila
 * @module products
 * @todo Add unique to email
 */
const express = require('express')
const mongoose = require('mongoose')
const Invoice = require('./models/invoice')
const Item = require('./models/item')
const Product = require('./models/product')
const auth = require('./authentication')
const rent = require('./models/rent')

var router = express.Router()

router.get('/', auth.verifyToken, async (req, res) => {
    const query = req.query
    const productName = req.query.productName
    delete query.productName
    if (query.start) query.start = { $gte: query.start }
    if (query.end) query.end = { $lte: query.end }
    try {
        let invoices = await Invoice.find(query)
        if (!productName) {
            res.status(200).json(invoices)
        } else {
            for (let invoice of invoices) {
                let prodObj = {}
                for (const [key, value] of invoice.products) {
                    let fullItem = await Item.findOne({
                        _id: key,
                    })
                    let product = await Product.findOne({ _id: fullItem.type })
                    prodObj[product.name] = value
                }
                invoice.products = prodObj
            }
            res.status(200).json(invoices)
        }
    } catch (err) {
        res.status(400).json({
            message: 'Bad query',
            error: err,
        })
    }
})

module.exports = router
