/**
 * @file API for managing the invoices
 * @author Antonio Lopez, Davide Cristoni, Gledis Gila
 * @module products
 * @todo Add unique to email
 */
const express = require('express')
const mongoose = require('mongoose')
const Invoice = require('./models/invoice')
const auth = require('./authentication')
const rent = require('./models/rent')

var router = express.Router()

router.get('/', auth.verifyToken, (req, res) => {
    const query = req.query
    Invoice.find(query)
        .exec()
        .then((docs) => {
            res.status(200).json(docs)
        })
        .catch((err) => {
            res.status(500).json({ message: 'Server error', error: err })
        })
})

module.exports = router
