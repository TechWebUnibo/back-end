/**
 * @file API for managing the products
 * @author Antonio Lopez, Davide Cristoni, Gledis Gila
 * @module products
 * @todo Add unique to email
 */
const express = require('express')
const mongoose = require('mongoose')
const Item = require('./models/item')
const Product = require('./models/product')
const Rent = require('./models/rent')
const multer = require('multer')
const path = require('path')
const bcrypt = require('bcryptjs')
const auth = require('./authentication')
const fs = require('fs')

var router = express.Router()

const productsPath = 'img/products'
const productsFullPath = path.join(
    global.rootDir,
    'public/media/',
    productsPath
)

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
            fs.unlinkSync(path.join(productsFullPath, path.basename(img)))
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
    data.img = path.join(productsPath, req.file.filename)
    const newProduct = new Product(data)
    newProduct
        .save()
        .then((result) => {
            res.status(200).json({
                message: 'Item created',
                product: newProduct,
            })
        })
        .catch((err) => {
            deleteImg(newProduct.img)
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
    Product.find(query)
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
 * Delete the category with the corresponding id.
 * @param {object} res - Response object.
 * @param {String} id  - Category id.
 */
router.delete('/:id', auth.verifyToken, (req, res) => {
    const id = req.params.id
    Item.exists({ type: id })
        .then((found) => {
            if (!found)
                Product.findOneAndDelete({ _id: id })
                    .exec()
                    .then((result) => {
                        deleteImg(result.img)
                        res.status(200).json({
                            message: 'Category deleted',
                            item: result,
                        })
                    })
            else
                res.status(406).json({
                    message:
                        'The category cannot be deleted, it is used in some item',
                    error: {},
                })
        })
        .catch((err) => {
            res.status(404).json({
                message: 'Category not found',
                error: err,
            })
        })
})

// Modify a category
router.post('/:id', auth.verifyToken, upload.single('img'), (req, res) => {
    const id = req.params.id
    let newData = req.body
    if (req.file)
        newData.img = req.file
            ? path.join(productsPath, req.file.filename)
            : undefined
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
            } else {
                deleteImg(newData.img)
                res.status(404).json({
                    message: 'Product not found',
                    product: result,
                })
            }
        })
        .catch((err) => {
            res.status(400).json({ message: 'Bad input parameter', error: err })
        })
})

router.get('/:id/available', async (req, res) => {
    let id = req.params.id
    var start = req.query.start
    var end = req.query.end

    if((!start || !end) || start > end)
        res.status(400).json({message: 'Bad query', error: {}})
    else{
        const category = await Product.findOne({_id: id})
        if(category){
            let products = category.products.length === 0 ? [id] : category.products
            let response = []
            for (const product of products) {
                let items = await getAvailable(product, start, end)
                if(items.length > 0){
                    let chosen = items.reduce((chosen, item) => item.price < chosen.price ? item : chosen, items[0])
                    response.push(chosen)
                }
                else{
                    res.status(200).json({ available: false })
                    return
                }
            }
                res.status(200).json({available: true, products: response.map(item => {return item['_id']}), price: computePrice(response, start, end)})
        }
        else{
            res.status(404).json({message: 'Product not found', error: {}})
        }
    }
    
})

async function getAvailable(id, start, end){
    let items = await Item.find({ type: id })
    let freeItems = []
    for (let item of items) {
        let occupied = await Rent.exists({
        products: item,
        $or: [
            { start: { $gt: start, $lt: end } },
            { end: { $gt: start, $lt: end } },
            { start: { $lt: start }, end: { $gt: end } },
            ],
        })
        // Compute the price for the possible rent
        if (!occupied && item.condition !== 'not available'){ 
            freeItems.push(item)
            }
        }
    return freeItems
}
/** 
* Compute the price for the given item
* @summary Price for the rent.
* @param {Object} item - Items to rent.
* @param {Date} start - Start of the rent
* @param {Date} end - End of the rent
* @return {Number} Price of the rent
*/
function computePrice(items, start, end){
    const conditions = {perfect: 0, good: 0.05, suitable: 0.1}
    const bundleDiscount = 0.1
    const renewTime = 86400000
    
    // To obtain the number of days: perform a integer division of the timestamp difference with the value of a day
    const days = Math.round((Date.parse(end) - Date.parse(start)) / renewTime) + 1
    let price = 0
    for(let item of items)
        price = price + item.price - (item.price * conditions[item.condition])
    price = price * days
    if(items.length > 1)
        price = price - price * bundleDiscount
    return price
}

module.exports = router
