/**
 * @file API for managing the products
 * @author Antonio Lopez, Davide Cristoni, Gledis Gila
 * @module products
 * @todo Add unique to email
 */
const express = require('express')
const mongoose = require('mongoose')
const Product = require('./models/product')
const multer = require('multer')
const path = require('path')
const bcrypt = require('bcryptjs')
const auth = require('./authentication')
const fs = require('fs')


var router = express.Router()

const productsPath = 'img/products'
const productsFullPath = path.join(global.rootDir, 'public/media/', productsPath)

// Initialize local storage
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, productsFullPath)
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)) //Appending extension
    },
})

const upload = multer({ storage: storage })


function deleteImg(img) {
    if (img) {
        try {
            fs.unlinkSync(
                path.join(productsFullPath, path.basename(img))
            )
        } catch (err) {
            console.log('Error while removing image')
            console.log({ error: err })
        }
    }
}




/**
 * Add a new product.
 * @param {object} data Data of the new product
 */
router.post('/', auth.verifyToken, upload.single('img'), (req, res) => {
    let data = req.body
    data._id = new mongoose.Types.ObjectId()
    data.img = req.file ? path.join(productsPath, req.file.filename) : ''
    const newProduct = new Product(data)
    newProduct
        .save()
        .then((result) => {
            res.status(200).json({
                message: 'Product created',
                product: newProduct,
            })
        })
        .catch((err) => {
            deleteImg(newProduct.img)
            res.status(400).json({ message: 'Bad input parameter', error: err })
        })
})

/**
 * Get all the products.
 * @param {res} res Response object
 */
router.get('/', (req, res) => {
    Product.find()
        .exec()
        .then((doc) => {
            res.status(200).json(doc)
        })
        .catch((err) => {
            res.status(500).json({ message: 'Internal error', error: err })
        })
})


/**
 * Delete the product with the corresponding id.
 * @param {object} res - Response object.
 * @param {String} id  - Product id.
 */
router.delete('/:id', auth.verifyToken, (req, res) => {
    const id = req.params.id
    Product.findOneAndDelete({ _id: id })
        .exec()
        .then((result) => {
            deleteImg(result.img)
            res.status(200).json({
                message: 'Product deleted',
                product: result,
            })
        })
        .catch((err) => {
            res.status(404).json({
                message: 'Product not found',
                error: err,
            })
        })
})

// Modify a product
router.post('/:id', auth.verifyToken, upload.single('img'), (req, res) => {
    const id = req.params.id
    let newData = req.body
    newData.img = req.file
        ? path.join(productsPath, req.file.filename)
        : newData.img
    Product.findOneAndUpdate(
        { _id: id },
        { $set: newData },
        { runValidators: true, new: false, useFindAndModify: false }
    )
        .exec()
        .then((result) => {
            if (result) {
                deleteImg(result.img)
                res.status(200).json({
                    message: 'Data modified',
                    product: result,
                })
            } else
                res.status(404).json({
                    message: 'Product not found',
                    product: result,
                })
        })
        .catch((err) => {
            deleteImg(newData.img)
            res.status(400).json({ message: 'Bad input parameter', error: err })
        })
})

module.exports = router
