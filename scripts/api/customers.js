/**
 * @file API for managing the customers
 * @author Antonio Lopez, Davide Cristoni, Gledis Gila
 * @module customers
 * @todo Add unique to email
 */
const express = require('express')
const mongoose = require('mongoose')
const fs = require('fs')
const Customer = require('./models/customer')
const multer = require('multer')
const path = require('path')
const bcrypt = require('bcryptjs')
const auth = require('./authentication')

var router = express.Router()

const avatarPath = 'img/avatar'
const avatarFullPath = path.join(global.rootDir, 'public/media/', avatarPath)

// Initialize local storage
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, avatarFullPath)
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)) //Appending extension
    },
})

const upload = multer({ storage: storage })

/**
 * Add a new customer.
 * @param {object} data Data of the new customer
 */
router.post('/', upload.single('avatar'), (req, res) => {
    let data = req.body
    data.password = bcrypt.hashSync(data.password, 14)
    data._id = new mongoose.Types.ObjectId()
    data.avatar = req.file ? path.join(avatarPath, req.file.filename) : ''
    const newCustomer = new Customer(data)
    newCustomer
        .save()
        .then((result) => {
            res.status(200).json({
                message: 'Customer created',
                customer: newCustomer,
            })
        })
        .catch((err) =>
            res.status(400).json({ message: 'Bad input parameter', error: err })
        )
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
            res.status(500).json({ message: 'Internal error', error: err })
        })
})

function deleteAvatar(customer) {
    if (customer.avatar) {
        try {
            fs.unlinkSync(
                path.join(avatarFullPath, path.basename(customer.avatar))
            )
        } catch (err) {
            console.log('Error while removing avatar')
            console.log({ error: err })
        }
    }
}

/**
 * Delete the customer with the corresponding id.
 * @param {object} res - Response object.
 * @param {String} id  - Customer id.
 */
router.delete('/:id', auth.verifyToken ,(req, res) => {
    const id = req.params.id
    Customer.findOneAndDelete({ _id: id })
        .exec()
        .then((result) => {
            deleteAvatar(result)
            res.status(200).json({
                message: 'Customer deleted',
                customer: result,
            })
        })
        .catch((err) => {
            res.status(404).json({
                message: 'Customer not found',
                error: err,
            })
        })
})

// Modify a customer
router.post('/:id', upload.single('avatar'), auth.verifyToken,(req, res) => {
    const id = req.params.id
    let newData = req.body
    newData.password = bcrypt.hashSync(newData.password, 14)
    newData.avatar = req.file
        ? path.join(avatarPath, req.file.filename)
        : newData.avatar
    Customer.findOneAndUpdate(
        { _id: id },
        { $set: newData },
        { runValidators: true, new: false, useFindAndModify: false }
    )
        .exec()
        .then((result) => {
            if (result) {
                deleteAvatar(result)
                res.status(200).json({
                    message: 'Data modified',
                    customer: result,
                })
            } else
                res.status(404).json({
                    message: 'Customer not found',
                    customer: result,
                })
        })
        .catch((err) => {
            res.status(400).json({ message: 'Bad input parameter', error: err })
        })
})

module.exports = router
