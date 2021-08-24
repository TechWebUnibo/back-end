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
                product: newProduct,
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
    Rent.exists({ items: id })
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
router.post('/:id', auth.verifyToken, (req, res) => {
    const id = req.params.id
    let newData = req.body
        ? path.join(productsPath, req.file.filename)
        : newData.img
    Item.findOneAndUpdate(
        { _id: id },
        { $set: newData },
        { runValidators: true, new: false, useFindAndModify: false }
    )
        .exec()
        .then((result) => {
            if (result) {
                res.status(200).json({
                    message: 'Data modified',
                    product: result,
                })
            } else
                res.status(404).json({
                    message: 'Item not found',
                    product: result,
                })
        })
        .catch((err) => {
            res.status(400).json({ message: 'Bad input parameter', error: err })
        })
})

module.exports = router
