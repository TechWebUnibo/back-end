/**
 * @file API for managing the reparations
 * @author Antonio Lopez, Davide Cristoni, Gledis Gila
 * @module products
 */

const express = require('express')
const mongoose = require('mongoose')
const Rep = require('./models/reparation')
const Item = require('./models/item')

const auth = require('./authentication')
const { makeBroken } = require('./support')

var router = express.Router()

// Get all the reparation filtered by query parameters
router.get('/', auth.verifyToken, (req, res) => {
    const query = req.query
    Rep.find(query)
        .exec()
        .then((result) => {
            console.log(result)
            res.status(200).json(result)
        })
        .catch((err) => {
            res.status(500).json({ message: 'Server error', error: err })
        })
})

router.post('/', auth.verifyToken, async (req, res) => {
    const data = req.body
    let rep
    try {
        rep = await makeBroken(data.products, 'broken', data.start, data.end)
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error })
    }
    return res.status(200).json(rep)
})

module.exports = router
