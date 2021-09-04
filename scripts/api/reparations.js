/**
 * @file API for managing the reparations
 * @author Antonio Lopez, Davide Cristoni, Gledis Gila
 * @module products
 */

const express = require('express')
const mongoose = require('mongoose')
const Rep = require('./models/reparation')

const auth = require('./authentication')

var router = express.Router()


router.get('/', auth.verifyToken, (req, res) =>{
    const query = req.query
    Rep.find()
    .exec()
    .then((result) => {
        res.status(200).json(result)
    })
    .catch((err) => {
        res.status(500).json({message: 'Server error', error: err})
    })
})


module.exports = router
