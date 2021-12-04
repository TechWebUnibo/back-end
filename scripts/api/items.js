/**
 * @file API for managing the products
 * @author Antonio Lopez, Davide Cristoni, Gledis Gila
 * @module products
 * @todo Add unique to email
 */
const express = require('express')
const mongoose = require('mongoose')
const Item = require('./models/item')
const Rent = require('./models/rent')
const support = require('./support')
const multer = require('multer')
const path = require('path')
const bcrypt = require('bcryptjs')
const auth = require('./authentication')
const fs = require('fs')

var router = express.Router()

/**
 * Add a new product.
 * @param {object} data Data of the new product
 */
router.post('/', auth.verifyToken, (req, res) => {
    let data = req.body
    data._id = new mongoose.Types.ObjectId()
    const newProduct = new Item(data)
    newProduct
        .save()
        .then((result) => {
            res.status(200).json({
                message: 'Item created',
                item: newProduct,
            })
        })
        .catch((err) => {
            res.status(400).json({ message: 'Bad input parameter', error: err })
        })
})

// TODO - only the type of the product
// TODO - make a function that check if a product is available

/**
 * Get all the products.
 * @param {res} res Response object
 */
router.get('/', (req, res) => {
    const query = req.query
    Item.find(query)
        .exec()
        .then((doc) => {
            res.status(200).json(doc)
        })
        .catch((err) => {
            res.status(500).json({ message: 'Internal error', error: err })
        })
})

/**
 * Get all the products categories.
 * @param {res} res Response object
 */
router.get('/categories/', (req, res) => {
    Item.find()
        .distinct('type')
        .exec()
        .then((doc) => {
            res.status(200).json(doc)
        })
        .catch((err) => {
            res.status(500).json({ message: 'Internal error', error: err })
        })
})

router.get(':/id/available', (req, res) => {
    const id = req.params.id
    Item.find()
        .distinct('type')
        .exec()
        .then((doc) => {
            res.status(200).json(doc)
        })
        .catch((err) => {
            res.status(500).json({ message: 'Internal error', error: err })
        })
})

/**
 * Delete the item with the corresponding id.
 * @param {object} res - Response object.
 * @param {String} id  - item id.
 * TODO - l'oggetto non va eliminato se esiste un noleggio a lui legato
 */
router.delete('/:id', auth.verifyToken, (req, res) => {
    const id = req.params.id
    Rent.exists({ products: id })
        .then((found) => {
            if (!found)
                Item.findOneAndDelete({ _id: id })
                    .exec()
                    .then((result) => {
                        res.status(200).json({
                            message: 'Item deleted',
                            item: result,
                        })
                    })
            else
                res.status(406).json({
                    message:
                        'The product cannot be deleted, it is used in some rent',
                    error: {},
                })
        })
        .catch((err) => {
            res.status(404).json({
                message: 'Item not found',
                error: err,
            })
        })
})

// Modify an item
router.post('/:id', auth.verifyToken, async (req, res) => {
    const id = req.params.id
    let newData = req.body
    let item = await Item.find({ _id: id })
    if (item) {
        if (newData.condition && newData.condition === 'not_available') {
            let start = new Date()
            start.setHours(0, 0, 0, 0)
            support.makeBroken([id], newData.condition, start.toISOString())
        } else if (
            newData.condition &&
            newData.condition === 'broken' &&
            (!newData.start || !newData.end || newData.start > newData.end)
        ) {
            return res.status(400).json({
                message:
                    'For a broken object you shuld insert a valid period of unavailability',
                error: {},
            })
        } else {
            support.makeBroken(
                [id],
                newData.condition,
                newData.start,
                newData.end
            )
        }
        result = await Item.findOneAndUpdate(
            { _id: id },
            { $set: newData },
            { runValidators: true, useFindAndModify: false }
        )
        res.status(200).json({
            message: 'Data modified',
            item: result,
        })
    } else {
        res.status(400).json({ message: 'Bad input parameter', error: {} })
    }
})

module.exports = router
