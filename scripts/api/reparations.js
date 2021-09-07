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

var router = express.Router()

// Get all the reparation filtered by query parameters
router.get('/', auth.verifyToken, (req, res) => {
    const query = req.query
    Rep.find()
        .exec()
        .then((result) => {
            res.status(200).json(result)
        })
        .catch((err) => {
            res.status(500).json({ message: 'Server error', error: err })
        })
})

router.post('/:id/terminate', auth.verifyToken, async (req, res) => {
    const id = req.params.id
    const rep = await Rep.findOne({ _id: id })

    if (rep && rep.state != 'terminated') {
        let products = []
        let returnItems = req.body
        // Check if the item inserted are the same of the rental
        for (const item of rep.products) {
            if (!returnItems[item]) {
                return res.status(400).json({
                    message:
                        'The items inserted does not match with the reparation one',
                    error: {},
                })
            }
            if (
                !returnItems[item].condition ||
                returnItems[item].condition === 'broken'
            ) {
                return res.status(400).json({
                    message:
                        'Bad input parameter, an item returned from a reparation cannot be still broken',
                    error: {},
                })
            }
        }
        for (const item of rep.products) {
            let result = await Item.findOneAndUpdate(
                { _id: item },
                { condition: returnItems[item].condition },
                { useFindAndModify: false }
            )
        }

        await Rep.updateOne({ _id: id }, { state: 'terminated' })
        return res.status(200).json(rep)
    } else {
        return res.status(404).json({
            message: 'Reparation not found or already terminated',
            error: {},
        })
    }
})

module.exports = router
